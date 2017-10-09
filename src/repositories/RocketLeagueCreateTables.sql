-- DROP TABLE `Certifications`;
-- DROP TABLE `CertificationTiers`;
-- DROP TABLE `Console`;
-- DROP TABLE `ItemCategories`;
-- DROP TABLE `ItemListVals`;
-- DROP TABLE `Paints`;

CREATE DATABASE `RocketLeague`;

CREATE TABLE `Certifications` (
   `CertificationId` int(11) NOT NULL AUTO_INCREMENT,
   `CertificationName` varchar(50) DEFAULT NULL,
   `TierId` int(11) DEFAULT NULL,
   `CertificationStat` varchar(100) DEFAULT NULL,
   PRIMARY KEY (`CertificationId`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

 CREATE TABLE `Console` (
   `ConsoleId` int(11) NOT NULL AUTO_INCREMENT,
   `ConsoleName` varchar(100) DEFAULT NULL,
   PRIMARY KEY (`ConsoleId`)
 ) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;


CREATE TABLE FullItemList (
   `ItemId` int PRIMARY KEY auto_increment,
   `ItemName` varchar(250),
   `CategoryId` int,
   `PaintDisabled` boolean,
   `DateAdded` datetime
);

 CREATE TABLE `ItemCategories` (
   `CategoryId` int(11) NOT NULL AUTO_INCREMENT,
   `CategoryName` varchar(50) DEFAULT NULL,
   `CanPaint` tinyint(1) DEFAULT NULL,
   PRIMARY KEY (`CategoryId`)
 ) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;

CREATE TABLE `ItemListVals` (
   `ItemListValsId` int(11) NOT NULL AUTO_INCREMENT,
   `ItemId` int(11) DEFAULT NULL,
   `PaintId` int(11) DEFAULT NULL,
   `MinVal` int(11) DEFAULT NULL,
   `MaxVal` int(11) DEFAULT NULL,
   `ConsoleId` int(11) DEFAULT NULL,
   `DateAdded` datetime DEFAULT NULL,
   PRIMARY KEY (`ItemListValsId`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

 CREATE TABLE `Paints` (
   `PaintId` int(11) NOT NULL AUTO_INCREMENT,
   `PaintName` varchar(50) DEFAULT NULL,
   PRIMARY KEY (`PaintId`)
 ) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;
