-- public.cfgestabfis definição

-- Drop table

-- DROP TABLE public.cfgestabfis;

CREATE TABLE public.cfgestabfis (
	codigoempresa int2 NOT NULL,
	codigoestab int2 NOT NULL,
	contadorrespfiscal int2 NOT NULL,
	usasintegra int2 NOT NULL,
	codigotabrelaccfop int4 NULL,
	tabelacfgimpspedfis int2 NULL,
	tabelacfgimpcte int2 NULL,
	tabelacfgimpbpe int2 NULL,
	tabelacfgimpsefii int2 NULL,
	diglctofisent varchar(12) NOT NULL,
	diglctofissai varchar(12) NOT NULL,
	usacontroleaidf bpchar(1) NOT NULL,
	lancaacrescimofinanceiro bpchar(1) NOT NULL,
	valortarifa numeric(16, 2) NULL,
	contabiliza int2 NOT NULL,
	datainicialcontabiliza date NULL,
	contabilizager bpchar(1) NOT NULL,
	formacontabilizager int2 NULL,
	datainiciallctousu date NULL,
	datafinallctousu date NULL,
	datainicialdupusu date NULL,
	datafinaldupusu date NULL,
	tabelacfgimpnfe int2 NULL,
	codigotabripoitem int4 NULL,
	codigotabrelaccfopncm int4 NULL,
	CONSTRAINT pkcfgestabfis PRIMARY KEY (codigoempresa, codigoestab)
);
CREATE INDEX fkcfgestabfiscfgimpsefii ON public.cfgestabfis USING btree (codigoempresa, tabelacfgimpsefii);
CREATE INDEX fkcfgestabfiscfgimpspedfis ON public.cfgestabfis USING btree (codigoempresa, tabelacfgimpspedfis);
CREATE INDEX fkcfgestabfiscontador ON public.cfgestabfis USING btree (contadorrespfiscal);
CREATE INDEX fkcfgestabfisestab ON public.cfgestabfis USING btree (codigoempresa, codigoestab);
CREATE INDEX fkcfgestabfistabrelcfop ON public.cfgestabfis USING btree (codigotabrelaccfop);


-- public.cfgestabfis chaves estrangeiras

ALTER TABLE public.cfgestabfis ADD CONSTRAINT fkcfgestabfiscfgimpsefii FOREIGN KEY (codigoempresa,tabelacfgimpsefii) REFERENCES public.cfgimpsefii(codigoempresa,seq);
ALTER TABLE public.cfgestabfis ADD CONSTRAINT fkcfgestabfiscfgimpspedfis FOREIGN KEY (codigoempresa,tabelacfgimpspedfis) REFERENCES public.cfgimpspedfis(codigoempresa,seqcfgimpspedfis);
ALTER TABLE public.cfgestabfis ADD CONSTRAINT fkcfgestabfiscontador FOREIGN KEY (contadorrespfiscal) REFERENCES public.contador(codigocont);
ALTER TABLE public.cfgestabfis ADD CONSTRAINT fkcfgestabfisestab FOREIGN KEY (codigoempresa,codigoestab) REFERENCES public.estab(codigoempresa,codigoestab);
ALTER TABLE public.cfgestabfis ADD CONSTRAINT fkcfgestabfistabrelcfop FOREIGN KEY (codigotabrelaccfop) REFERENCES public.tabelarelaccfop(codigotabrelaccfop);