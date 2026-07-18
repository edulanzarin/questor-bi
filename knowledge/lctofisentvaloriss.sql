-- public.lctofisentvaloriss definição

-- Drop table

-- DROP TABLE public.lctofisentvaloriss;

CREATE TABLE public.lctofisentvaloriss (
	codigoempresa int2 NOT NULL,
	chavelctofisent int8 NOT NULL,
	codigocampo int4 NOT NULL,
	valor varchar(20) NOT NULL,
	CONSTRAINT pklctofisentvaloriss PRIMARY KEY (codigoempresa, chavelctofisent, codigocampo)
);
CREATE INDEX fklctofisentvalorisscampo ON public.lctofisentvaloriss USING btree (codigocampo);
CREATE INDEX fklctofisentvalorissent ON public.lctofisentvaloriss USING btree (codigoempresa, chavelctofisent);


-- public.lctofisentvaloriss chaves estrangeiras

ALTER TABLE public.lctofisentvaloriss ADD CONSTRAINT fklctofisentvalorisscampo FOREIGN KEY (codigocampo) REFERENCES public.campoiss(codigocampo);
ALTER TABLE public.lctofisentvaloriss ADD CONSTRAINT fklctofisentvalorissent FOREIGN KEY (codigoempresa,chavelctofisent) REFERENCES public.lctofisent(codigoempresa,chavelctofisent) ON DELETE CASCADE ON UPDATE CASCADE;