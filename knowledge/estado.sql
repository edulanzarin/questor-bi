-- public.estado definição

-- Drop table

-- DROP TABLE public.estado;

CREATE TABLE public.estado (
	siglaestado bpchar(2) NOT NULL,
	nomeestado varchar(30) NOT NULL,
	estadobrasil bpchar(1) NOT NULL,
	codigopais int2 NULL,
	aliqicmsinterna numeric(7, 2) NULL,
	aliqicmsexterna numeric(7, 2) NULL,
	codigosinief int2 NULL,
	regiaofiscal int2 NULL,
	codigoibge int2 NULL,
	regiaogeogr int2 NULL,
	mascinscrestad varchar(25) NULL,
	utilizaativest bpchar(1) NULL,
	mascativestad varchar(25) NULL,
	simplesfederal bpchar(1) NULL,
	aliqsimplesfederal numeric(7, 2) NULL,
	CONSTRAINT pkestado PRIMARY KEY (siglaestado)
);
CREATE INDEX fkestadopais ON public.estado USING btree (codigopais);


-- public.estado chaves estrangeiras

ALTER TABLE public.estado ADD CONSTRAINT fkestadopais FOREIGN KEY (codigopais) REFERENCES public.pais(codigopais);