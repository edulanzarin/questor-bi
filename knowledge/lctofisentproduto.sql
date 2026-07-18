-- public.lctofisentproduto definição

-- Drop table

-- DROP TABLE public.lctofisentproduto;

CREATE TABLE public.lctofisentproduto (
	codigoempresa int2 NOT NULL,
	chavelctofisent int8 NOT NULL,
	seq int2 NOT NULL,
	codigoestab int2 NOT NULL,
	datalctofis date NOT NULL,
	codigoproduto numeric(15) NOT NULL,
	codigocfop int4 NOT NULL,
	codigosituacaotribut int2 NOT NULL,
	unidademedida varchar(10) NOT NULL,
	codigoorigemproduto int2 NULL,
	valorunitario numeric(16, 2) NOT NULL,
	valortotal numeric(16, 2) NOT NULL,
	basecalculoicms numeric(16, 2) NOT NULL,
	aliqicms numeric(7, 2) NOT NULL,
	valoricms numeric(16, 2) NOT NULL,
	isentasicms numeric(16, 2) NOT NULL,
	outrasicms numeric(16, 2) NOT NULL,
	basecalculoipi numeric(16, 2) NOT NULL,
	aliqipi numeric(7, 2) NOT NULL,
	valoripi numeric(16, 2) NOT NULL,
	isentasipi numeric(16, 2) NOT NULL,
	outrasipi numeric(16, 2) NOT NULL,
	basecalculoiss numeric(16, 2) NOT NULL,
	aliqiss numeric(7, 2) NOT NULL,
	valoriss numeric(16, 2) NOT NULL,
	isentasiss numeric(16, 2) NOT NULL,
	outrasiss numeric(16, 2) NOT NULL,
	basecalculosubtribut numeric(16, 2) NOT NULL,
	aliqsubtribut numeric(7, 2) NOT NULL,
	valorsubtribut numeric(16, 2) NOT NULL,
	valordesconto numeric(16, 2) NOT NULL,
	valordespesa numeric(16, 2) NOT NULL,
	tipoestoque int2 NULL,
	cstipi int2 NULL,
	cstiss int2 NULL,
	cststicms int2 NULL,
	qtdeseloipi int4 NULL,
	vlrfrete numeric(17, 2) NULL,
	vlrpedagio numeric(17, 2) NULL,
	vlrseguro numeric(17, 2) NULL,
	abatnaotrib numeric(17, 2) NULL,
	outrassubtrib numeric(16, 2) NULL,
	isentassubtrib numeric(16, 2) NULL,
	indmov bpchar(1) NULL,
	indnatfrt int2 NULL,
	descricaocomplregc170 varchar(120) NULL,
	reducaobcicms numeric(7, 2) NULL,
	reducaobcicmsst numeric(7, 2) NULL,
	fcpicmsdestacado numeric(16, 2) NULL,
	icmsdestacado numeric(16, 2) NULL,
	quantidade numeric(21, 6) NOT NULL,
	valoripidevolvido numeric(16, 2) NULL,
	indicadorsittribut bpchar(1) NULL,
	CONSTRAINT pklctofisentproduto PRIMARY KEY (codigoempresa, chavelctofisent, seq)
);
CREATE INDEX fklctofisentprodorigemprod ON public.lctofisentproduto USING btree (codigoorigemproduto);
CREATE INDEX fklctofisentprodutocfgestabfis ON public.lctofisentproduto USING btree (codigoempresa, codigoestab);
CREATE INDEX fklctofisentprodutolctofisent ON public.lctofisentproduto USING btree (codigoempresa, chavelctofisent);
CREATE INDEX fklctofisentprodutoproduto ON public.lctofisentproduto USING btree (codigoempresa, codigoproduto);
CREATE INDEX ixlctofisentproduto ON public.lctofisentproduto USING btree (codigoempresa, codigoestab, datalctofis);


-- public.lctofisentproduto chaves estrangeiras

ALTER TABLE public.lctofisentproduto ADD CONSTRAINT fklctofisentprodorigemprod FOREIGN KEY (codigoorigemproduto) REFERENCES public.origemproduto(codigoorigemproduto);
ALTER TABLE public.lctofisentproduto ADD CONSTRAINT fklctofisentprodutocfgestabfis FOREIGN KEY (codigoempresa,codigoestab) REFERENCES public.cfgestabfis(codigoempresa,codigoestab);
ALTER TABLE public.lctofisentproduto ADD CONSTRAINT fklctofisentprodutolctofisent FOREIGN KEY (codigoempresa,chavelctofisent) REFERENCES public.lctofisent(codigoempresa,chavelctofisent) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.lctofisentproduto ADD CONSTRAINT fklctofisentprodutoproduto FOREIGN KEY (codigoempresa,codigoproduto) REFERENCES public.produto(codigoempresa,codigoproduto);