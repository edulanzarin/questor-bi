-- public.lctofissaipiscofins definição

-- Drop table

-- DROP TABLE public.lctofissaipiscofins;

CREATE TABLE public.lctofissaipiscofins (
	codigoempresa int2 NOT NULL,
	chavelctofissai int8 NOT NULL,
	seq int2 NOT NULL,
	codigoestab int2 NOT NULL,
	datalctofis date NOT NULL,
	codigoproduto numeric(15) NOT NULL,
	codigocfop int4 NOT NULL,
	receitapiscofins numeric(16, 2) NOT NULL,
	basecalculopiscofins numeric(16, 2) NOT NULL,
	quantidade numeric(18, 4) NOT NULL,
	cdsituatributpis int4 NULL,
	aliqpis numeric(11, 4) NOT NULL,
	tipodebitopis varchar(20) NOT NULL,
	valorpis numeric(16, 2) NOT NULL,
	cdsituatributcofins int4 NULL,
	aliqcofins numeric(11, 4) NOT NULL,
	valorcofins numeric(16, 2) NOT NULL,
	contactbefd varchar(10) NULL,
	tipodebito varchar(20) NOT NULL,
	CONSTRAINT pklctofissaipiscofins PRIMARY KEY (codigoempresa, chavelctofissai, seq)
);
CREATE INDEX fklctofissaipiscofinsestab ON public.lctofissaipiscofins USING btree (codigoempresa, codigoestab);
CREATE INDEX fklctofissaipiscofinslctfissai ON public.lctofissaipiscofins USING btree (codigoempresa, chavelctofissai);
CREATE INDEX fklctofissaipiscofinsproduto ON public.lctofissaipiscofins USING btree (codigoempresa, codigoproduto);
CREATE INDEX fklctofissaipiscofinstabsped ON public.lctofissaipiscofins USING btree (tipodebito);
CREATE INDEX fklctofissaipiscofstabsppis ON public.lctofissaipiscofins USING btree (tipodebitopis);
CREATE INDEX fklctofissaipisconfcfop ON public.lctofissaipiscofins USING btree (codigoempresa, codigoestab, codigocfop);
CREATE INDEX ixlctofissaipiscofins ON public.lctofissaipiscofins USING btree (codigoempresa, codigoestab, datalctofis);
CREATE INDEX ixlctofissaipiscofinsapu ON public.lctofissaipiscofins USING btree (codigoempresa, datalctofis, codigocfop);


-- public.lctofissaipiscofins chaves estrangeiras

ALTER TABLE public.lctofissaipiscofins ADD CONSTRAINT fklctofissaipiscofinsestab FOREIGN KEY (codigoempresa,codigoestab) REFERENCES public.cfgestabfis(codigoempresa,codigoestab);
ALTER TABLE public.lctofissaipiscofins ADD CONSTRAINT fklctofissaipiscofinslctfissai FOREIGN KEY (codigoempresa,chavelctofissai) REFERENCES public.lctofissai(codigoempresa,chavelctofissai) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.lctofissaipiscofins ADD CONSTRAINT fklctofissaipiscofinsproduto FOREIGN KEY (codigoempresa,codigoproduto) REFERENCES public.produto(codigoempresa,codigoproduto);
ALTER TABLE public.lctofissaipiscofins ADD CONSTRAINT fklctofissaipiscofinstabsped FOREIGN KEY (tipodebito) REFERENCES public.tabelasped(codigotabsped) ON UPDATE CASCADE;
ALTER TABLE public.lctofissaipiscofins ADD CONSTRAINT fklctofissaipiscofstabsppis FOREIGN KEY (tipodebitopis) REFERENCES public.tabelasped(codigotabsped) ON UPDATE CASCADE;
ALTER TABLE public.lctofissaipiscofins ADD CONSTRAINT fklctofissaipisconfcfop FOREIGN KEY (codigoempresa,codigoestab,codigocfop) REFERENCES public.cfop(codigoempresa,codigoestab,codigocfop);