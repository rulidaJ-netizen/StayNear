import { db } from "../../../shared/db.js";

export const recordRoomView = (req, res) => {
  const studentId = Number(req.user?.student_id);
  const boardinghouseId = Number.parseInt(req.params.id, 10);

  if (!studentId || !Number.isInteger(boardinghouseId)) {
    return res.status(400).json({ message: "Invalid request" });
  }

  db.query(
    `
      UPDATE boarding_house
      SET view_count = view_count + 1
      WHERE boardinghouse_id = ?
    `,
    [boardinghouseId],
    (updateError, updateResult) => {
      if (updateError) {
        console.error("Update view count error:", updateError);
        return res.status(500).json({ message: "Server error" });
      }

      if (!updateResult?.affectedRows) {
        return res.status(404).json({ message: "Listing not found" });
      }

      return res.status(200).json({
        message: "View recorded",
        boardinghouse_id: boardinghouseId,
        student_id: studentId,
      });
    }
  );
};
