CREATE TABLE UserData (
	gameId varchar(50) NOT NULL,
	userId varchar(50) NOT NULL,
	score double precision NOT NULL CHECK (score >= 0),
	name varchar(50),
	params varchar(255),
	PRIMARY KEY (gameId, userId)
);

CREATE INDEX ScoreIndex ON UserData (gameId ASC, score DESC);