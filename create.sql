CREATE TABLE `user` (
  `id` INT(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `external_id` VARCHAR(255) NOT NULL,
  `profile` VARCHAR(255) NOT NULL,
  `oauth` TEXT NULL,
  `picture` VARCHAR(255) NULL,
  `queue` VARCHAR(255) NULL,
  `points` INT(10) NULL DEFAULT '0',
  `region` CHAR(3) NOT NULL DEFAULT 'US',
  `settings` TEXT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `external_id` (`external_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `room` (
  `id` INT(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `owner_id` INT(10) UNSIGNED NOT NULL,
  `settings` TEXT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `slug` (`slug`),
  KEY `owner_id` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
