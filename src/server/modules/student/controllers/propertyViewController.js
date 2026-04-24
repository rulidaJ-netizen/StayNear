import { db } from "../../../shared/db.js";

export const recordRoomView = (req, res) => {
  const studentId = Number(req.user?.student_id);
  const boardinghouseId = Number.parseInt(req.params.id, 10);

  if (!studentId || !Number.isInteger(boardinghouseId)) {
    return res.status(400).json({ message: "Invalid request" });
  }

  db.beginTransaction((transactionError) => {
    if (transactionError) {
      console.error("Start property view transaction error:", transactionError);
      return res.status(500).json({ message: "Server error" });
    }

    db.query(
      `
        SELECT view_count
        FROM boarding_house
        WHERE boardinghouse_id = ?
        FOR UPDATE
      `,
      [boardinghouseId],
      (listingError, listingRows) => {
        if (listingError) {
          console.error("Fetch listing view count error:", listingError);
          return db.rollback(() => res.status(500).json({ message: "Server error" }));
        }

        if (!listingRows.length) {
          return db.rollback(() =>
            res.status(404).json({ message: "Listing not found" })
          );
        }

        const currentViewCount = Number(listingRows[0].view_count || 0);

        db.query(
          `
            INSERT IGNORE INTO property_views (boardinghouse_id, student_id)
            VALUES (?, ?)
          `,
          [boardinghouseId, studentId],
          (insertError, insertResult) => {
            if (insertError) {
              console.error("Insert property view error:", insertError);
              return db.rollback(() =>
                res.status(500).json({ message: "Server error" })
              );
            }

            const didInsertView = Number(insertResult?.affectedRows || 0) === 1;
            const finalizeResponse = (viewCount) =>
              db.commit((commitError) => {
                if (commitError) {
                  console.error("Commit property view transaction error:", commitError);
                  return db.rollback(() =>
                    res.status(500).json({ message: "Server error" })
                  );
                }

                return res.status(200).json({
                  message: didInsertView ? "View recorded" : "View already recorded",
                  boardinghouse_id: boardinghouseId,
                  student_id: studentId,
                  view_count: viewCount,
                  incremented: didInsertView,
                });
              });

            if (!didInsertView) {
              return finalizeResponse(currentViewCount);
            }

            return db.query(
              `
                UPDATE boarding_house
                SET view_count = view_count + 1
                WHERE boardinghouse_id = ?
              `,
              [boardinghouseId],
              (updateError) => {
                if (updateError) {
                  console.error("Increment view count error:", updateError);
                  return db.rollback(() =>
                    res.status(500).json({ message: "Server error" })
                  );
                }

                return finalizeResponse(currentViewCount + 1);
              }
            );
          }
        );
      }
    );
  });
};
