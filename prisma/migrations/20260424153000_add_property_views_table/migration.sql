-- CreateTable
CREATE TABLE `property_views` (
    `view_id` INTEGER NOT NULL AUTO_INCREMENT,
    `boardinghouse_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `viewed_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `property_views_student_id_boardinghouse_id_key`(`student_id`, `boardinghouse_id`),
    INDEX `property_views_boardinghouse_id_fkey`(`boardinghouse_id`),
    PRIMARY KEY (`view_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `property_views` ADD CONSTRAINT `property_views_boardinghouse_id_fkey` FOREIGN KEY (`boardinghouse_id`) REFERENCES `boarding_house`(`boardinghouse_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `property_views` ADD CONSTRAINT `property_views_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`student_id`) ON DELETE CASCADE ON UPDATE RESTRICT;
