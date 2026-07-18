-- public.lctofissaicfop definição

-- Drop table

-- DROP TABLE public.lctofissaicfop;

CREATE TABLE public.lctofissaicfop (
	codigoempresa int2 NOT NULL,
	chavelctofissai int8 NOT NULL,
	codigocfop int4 NOT NULL,
	tipoimposto int2 NOT NULL,
	aliqimposto numeric(7, 2) NOT NULL,
	datalctofis date NOT NULL,
	codigoestab int2 NOT NULL,
	valorcontabilimposto numeric(16, 2) NOT NULL,
	basecalculoimposto numeric(16, 2) NOT NULL,
	valorimposto numeric(16, 2) NOT NULL,
	isentasimposto numeric(16, 2) NOT NULL,
	outrasimposto numeric(16, 2) NOT NULL,
	valorexvaloradicional numeric(16, 2) NOT NULL,
	codigotabctbfis int2 NULL,
	idsyn int4 NULL,
	CONSTRAINT pklctofissaicfop PRIMARY KEY (codigoempresa, chavelctofissai, codigocfop, tipoimposto, aliqimposto)
);
CREATE INDEX fklctofissaicfopcfop ON public.lctofissaicfop USING btree (codigoempresa, codigoestab, codigocfop);
CREATE INDEX fklctofissaicfoplctofissai ON public.lctofissaicfop USING btree (codigoempresa, chavelctofissai);
CREATE INDEX fklctofissaicfoptabctbfis ON public.lctofissaicfop USING btree (codigoempresa, codigotabctbfis);
CREATE INDEX ixlctofissaicfop ON public.lctofissaicfop USING btree (codigoempresa, codigoestab, datalctofis);
CREATE INDEX ixlctofissaicfoptipoimposto ON public.lctofissaicfop USING btree (codigoempresa, codigoestab, datalctofis, tipoimposto);


-- public.lctofissaicfop chaves estrangeiras

ALTER TABLE public.lctofissaicfop ADD CONSTRAINT fklctofissaicfopcfop FOREIGN KEY (codigoempresa,codigoestab,codigocfop) REFERENCES public.cfop(codigoempresa,codigoestab,codigocfop);
ALTER TABLE public.lctofissaicfop ADD CONSTRAINT fklctofissaicfoplctofissai FOREIGN KEY (codigoempresa,chavelctofissai) REFERENCES public.lctofissai(codigoempresa,chavelctofissai) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.lctofissaicfop ADD CONSTRAINT fklctofissaicfoptabctbfis FOREIGN KEY (codigoempresa,codigotabctbfis) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);