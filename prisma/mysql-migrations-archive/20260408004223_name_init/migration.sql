-- CreateTable
CREATE TABLE `account` (
    `account_id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_type` ENUM('STUDENT', 'LANDOWNER') NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `student_id` INTEGER NULL,
    `landowner_id` INTEGER NULL,

    UNIQUE INDEX `email`(`email`),
    UNIQUE INDEX `student_id`(`student_id`),
    UNIQUE INDEX `landowner_id`(`landowner_id`),
    PRIMARY KEY (`account_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `boarding_house` (
    `boardinghouse_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `availability_status` ENUM('AVAILABLE', 'FULL', 'INACTIVE') NOT NULL DEFAULT 'AVAILABLE',
    `amenities` TEXT NOT NULL,
    `landowner_id` INTEGER NOT NULL,
    `description` TEXT NOT NULL,
    `contact_number` INTEGER NULL,
    `distance_fron_university` VARCHAR(255) NOT NULL,
    `reference_map` VARCHAR(255) NULL,
    `view_count` INTEGER NOT NULL DEFAULT 0,

    INDEX `fk_boardinghouse_landowner`(`landowner_id`),
    PRIMARY KEY (`boardinghouse_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `boardinghouse_photos` (
    `photo_id` INTEGER NOT NULL AUTO_INCREMENT,
    `boardinghouse_id` INTEGER NOT NULL,
    `photo_url` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_photos_boardinghouse`(`boardinghouse_id`),
    PRIMARY KEY (`photo_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `favorite_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `boardinghouse_id` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_favorite_boardinghouse`(`boardinghouse_id`),
    UNIQUE INDEX `uniq_favorite`(`student_id`, `boardinghouse_id`),
    PRIMARY KEY (`favorite_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `landowner` (
    `landowner_id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(100) NOT NULL,
    `middleName` VARCHAR(100) NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `gender` VARCHAR(50) NOT NULL,
    `age` INTEGER NOT NULL,
    `mobile_no` VARCHAR(50) NOT NULL,
    `birthdate` DATE NOT NULL,

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`landowner_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `room_id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_type` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `capacity` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `availability_status` ENUM('AVAILABLE', 'FULL', 'INACTIVE') NOT NULL DEFAULT 'AVAILABLE',
    `student_id` INTEGER NULL,
    `boardinghouse_id` INTEGER NOT NULL,

    INDEX `fk_rooms_boardinghouse`(`boardinghouse_id`),
    INDEX `fk_rooms_student`(`student_id`),
    PRIMARY KEY (`room_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student` (
    `student_id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(100) NOT NULL,
    `middleName` VARCHAR(100) NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `gender` VARCHAR(50) NOT NULL,
    `age` INTEGER NOT NULL,
    `mobile_no` VARCHAR(50) NOT NULL,
    `birthdate` DATE NOT NULL,

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `fk_account_landowner` FOREIGN KEY (`landowner_id`) REFERENCES `landowner`(`landowner_id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `fk_account_student` FOREIGN KEY (`student_id`) REFERENCES `student`(`student_id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `boarding_house` ADD CONSTRAINT `fk_boardinghouse_landowner` FOREIGN KEY (`landowner_id`) REFERENCES `landowner`(`landowner_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `boardinghouse_photos` ADD CONSTRAINT `fk_photos_boardinghouse` FOREIGN KEY (`boardinghouse_id`) REFERENCES `boarding_house`(`boardinghouse_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `fk_favorite_boardinghouse` FOREIGN KEY (`boardinghouse_id`) REFERENCES `boarding_house`(`boardinghouse_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `fk_favorite_student` FOREIGN KEY (`student_id`) REFERENCES `student`(`student_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `fk_rooms_boardinghouse` FOREIGN KEY (`boardinghouse_id`) REFERENCES `boarding_house`(`boardinghouse_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `fk_rooms_student` FOREIGN KEY (`student_id`) REFERENCES `student`(`student_id`) ON DELETE SET NULL ON UPDATE RESTRICT;
