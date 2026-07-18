-- public.lctofissaifunrural definição

-- Drop table

-- DROP TABLE public.lctofissaifunrural;

CREATE TABLE public.lctofissaifunrural (
	codigoempresa int2 NOT NULL,
	chavelctofissai int8 NOT NULL,
	seq int2 NOT NULL,
	codigoestab int2 NOT NULL,
	datalctofis date NOT NULL,
	codigocfop int4 NOT NULL,
	aliqimpostocfop numeric(7, 2) NOT NULL,
	basecalculofunrural numeric(16, 2) NOT NULL,
	aliqfunrural numeric(7, 2) NOT NULL,
	valorfunrural numeric(16, 2) NOT NULL,
	CONSTRAINT pklctofissaifunrural PRIMARY KEY (codigoempresa, chavelctofissai, seq)
);
CREATE INDEX fklctofissaifunruralcfop ON public.lctofissaifunrural USING btree (codigoempresa, codigoestab, codigocfop);
CREATE INDEX fklctofissaifunruralestab ON public.lctofissaifunrural USING btree (codigoempresa, codigoestab);
CREATE INDEX fklctofissaifunrurallctfissai ON public.lctofissaifunrural USING btree (codigoempresa, chavelctofissai);
CREATE INDEX ixlctofissaifunrural ON public.lctofissaifunrural USING btree (codigoempresa, codigoestab, datalctofis);


-- public.lctofissaifunrural chaves estrangeiras

ALTER TABLE public.lctofissaifunrural ADD CONSTRAINT fklctofissaifunruralcfop FOREIGN KEY (codigoempresa,codigoestab,codigocfop) REFERENCES public.cfop(codigoempresa,codigoestab,codigocfop);
ALTER TABLE public.lctofissaifunrural ADD CONSTRAINT fklctofissaifunruralestab FOREIGN KEY (codigoempresa,codigoestab) REFERENCES public.cfgestabfis(codigoempresa,codigoestab);
ALTER TABLE public.lctofissaifunrural ADD CONSTRAINT fklctofissaifunrurallctfissai FOREIGN KEY (codigoempresa,chavelctofissai) REFERENCES public.lctofissai(codigoempresa,chavelctofissai) ON DELETE CASCADE;