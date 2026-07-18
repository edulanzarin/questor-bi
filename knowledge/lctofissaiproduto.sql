-- public.lctofissaiproduto definição

-- Drop table

-- DROP TABLE public.lctofissaiproduto;

CREATE TABLE public.lctofissaiproduto (
	codigoempresa int2 NOT NULL,
	chavelctofissai int8 NOT NULL,
	seq int2 NOT NULL,
	codigoestab int2 NOT NULL,
	datalctofis date NOT NULL,
	codigoproduto numeric(15) NOT NULL,
	codigocfop int4 NOT NULL,
	codigosituacaotribut int2 NOT NULL,
	unidademedida varchar(10) NOT NULL,
	valorunitario numeric(16, 2) NOT NULL,
	codigoorigemproduto int2 NULL,
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
	tipooperacao int2 NULL,
	reducaobcicms numeric(7, 2) NULL,
	reducaobcicmsst numeric(7, 2) NULL,
	quantidade numeric(21, 6) NOT NULL,
	indicadorsittribut bpchar(1) NULL,
	CONSTRAINT pklctofissaiproduto PRIMARY KEY (codigoempresa, chavelctofissai, seq)
);
CREATE INDEX fklctofissaiprodorigemprod ON public.lctofissaiproduto USING btree (codigoorigemproduto);
CREATE INDEX fklctofissaiprodutocfgestabfis ON public.lctofissaiproduto USING btree (codigoempresa, codigoestab);
CREATE INDEX fklctofissaiprodutolctofissai ON public.lctofissaiproduto USING btree (codigoempresa, chavelctofissai);
CREATE INDEX fklctofissaiprodutoproduto ON public.lctofissaiproduto USING btree (codigoempresa, codigoproduto);
CREATE INDEX ixlctofissaiproduto ON public.lctofissaiproduto USING btree (codigoempresa, codigoestab, datalctofis);
CREATE INDEX ixlctofissaiprodutocodproduto ON public.lctofissaiproduto USING btree (codigoempresa, codigoestab, datalctofis, chavelctofissai, codigoproduto);


-- public.lctofissaiproduto chaves estrangeiras

ALTER TABLE public.lctofissaiproduto ADD CONSTRAINT fklctofissaiprodorigemprod FOREIGN KEY (codigoorigemproduto) REFERENCES public.origemproduto(codigoorigemproduto);
ALTER TABLE public.lctofissaiproduto ADD CONSTRAINT fklctofissaiprodutocfgestabfis FOREIGN KEY (codigoempresa,codigoestab) REFERENCES public.cfgestabfis(codigoempresa,codigoestab);
ALTER TABLE public.lctofissaiproduto ADD CONSTRAINT fklctofissaiprodutolctofissai FOREIGN KEY (codigoempresa,chavelctofissai) REFERENCES public.lctofissai(codigoempresa,chavelctofissai) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.lctofissaiproduto ADD CONSTRAINT fklctofissaiprodutoproduto FOREIGN KEY (codigoempresa,codigoproduto) REFERENCES public.produto(codigoempresa,codigoproduto);