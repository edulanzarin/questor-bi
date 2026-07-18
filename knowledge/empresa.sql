-- public.empresa definição

-- Drop table

-- DROP TABLE public.empresa;

CREATE TABLE public.empresa (
	codigoempresa int2 NOT NULL,
	marcadaguaempresa bytea NULL,
	nomeempresa varchar(100) NOT NULL,
	logotipoempresa bytea NULL,
	CONSTRAINT pkempresa PRIMARY KEY (codigoempresa)
);