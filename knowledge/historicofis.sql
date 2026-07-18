-- public.historicofis definição

-- Drop table

-- DROP TABLE public.historicofis;

CREATE TABLE public.historicofis (
	codigohistfis int2 NOT NULL,
	descrhistfis varchar(70) NOT NULL,
	CONSTRAINT pkhistoricofis PRIMARY KEY (codigohistfis)
);