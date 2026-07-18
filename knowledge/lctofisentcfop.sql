-- public.lctofisentcfop definição

-- Drop table

-- DROP TABLE public.lctofisentcfop;

CREATE TABLE public.lctofisentcfop (
	codigoempresa int2 NOT NULL,
	chavelctofisent int8 NOT NULL,
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
	CONSTRAINT pklctofisentcfop PRIMARY KEY (codigoempresa, chavelctofisent, tipoimposto, codigocfop, aliqimposto)
);
CREATE INDEX fklctofisentcfopcfop ON public.lctofisentcfop USING btree (codigoempresa, codigoestab, codigocfop);
CREATE INDEX fklctofisentcfoplctofisent ON public.lctofisentcfop USING btree (codigoempresa, chavelctofisent);
CREATE INDEX fklctofisentcfoptabctbfis ON public.lctofisentcfop USING btree (codigoempresa, codigotabctbfis);
CREATE INDEX ixlctofisentcfop ON public.lctofisentcfop USING btree (codigoempresa, codigoestab, datalctofis);


-- public.lctofisentcfop chaves estrangeiras

ALTER TABLE public.lctofisentcfop ADD CONSTRAINT fklctofisentcfopcfop FOREIGN KEY (codigoempresa,codigoestab,codigocfop) REFERENCES public.cfop(codigoempresa,codigoestab,codigocfop);
ALTER TABLE public.lctofisentcfop ADD CONSTRAINT fklctofisentcfoplctofisent FOREIGN KEY (codigoempresa,chavelctofisent) REFERENCES public.lctofisent(codigoempresa,chavelctofisent) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.lctofisentcfop ADD CONSTRAINT fklctofisentcfoptabctbfis FOREIGN KEY (codigoempresa,codigotabctbfis) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);