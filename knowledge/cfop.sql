-- public.cfop definição

-- Drop table

-- DROP TABLE public.cfop;

CREATE TABLE public.cfop (
	codigoempresa int2 NOT NULL,
	codigoestab int2 NOT NULL,
	codigocfop int4 NOT NULL,
	descrcfop varchar(100) NOT NULL,
	apuraicms bpchar(1) NOT NULL,
	codigotabctbfisicms int2 NULL,
	apuraiss bpchar(1) NOT NULL,
	codigotabctbfisiss int2 NULL,
	apuraipi bpchar(1) NOT NULL,
	codigotabctbfisipi int2 NULL,
	apurafunrural bpchar(1) NOT NULL,
	codigotabctbfisfunrural int2 NULL,
	apurasubtribut bpchar(1) NOT NULL,
	codigotabctbfissubtribut int2 NULL,
	apurapiscofinsoutros bpchar(1) NOT NULL,
	codigotabctbfispis int2 NULL,
	codigotabctbfiscofins int2 NULL,
	apurairrfret bpchar(1) NOT NULL,
	aliqirrfret numeric(7, 2) NOT NULL,
	codigotabctbfisirrfret int2 NULL,
	apurairpjret bpchar(1) NOT NULL,
	aliqirpjret numeric(7, 2) NOT NULL,
	codigotabctbfisirpjret int2 NULL,
	apurainssret bpchar(1) NOT NULL,
	aliqinssret numeric(7, 2) NOT NULL,
	codigotabctbfisinssret int2 NULL,
	apuraissqnret bpchar(1) NOT NULL,
	aliqissqnret numeric(7, 2) NOT NULL,
	codigotabctbfisissqnret int2 NULL,
	apurapiscofinscsllret bpchar(1) NOT NULL,
	aliqpisret numeric(7, 2) NOT NULL,
	codigotabctbfispisret int2 NULL,
	aliqcofinsret numeric(7, 2) NOT NULL,
	codigotabctbfiscofinsret int2 NULL,
	aliqcsllret numeric(7, 2) NOT NULL,
	codigotabctbfiscsllret int2 NULL,
	detalhardmed bpchar(1) NOT NULL,
	entrabasevaloradicional int2 NOT NULL,
	exvaloradicional int2 NOT NULL,
	regrabaseexvaloradicional varchar(100) NULL,
	codigotabctbfisvlrcontabil int2 NULL,
	detalharitemnf bpchar(1) NOT NULL,
	detalharduplicata bpchar(1) NOT NULL,
	diferida bpchar(1) NOT NULL,
	detalhardifalfcp bpchar(1) NOT NULL,
	cstpiscofins int4 NULL,
	finalidade int2 NOT NULL,
	contactblivro int8 NULL,
	contactbefd varchar(10) NULL,
	descrcomplcfop text NULL,
	apuracaossimplesfederal bpchar(1) NOT NULL,
	codigotabctbfisdifalfcp int2 NULL,
	apuraicmsmonofasico bpchar(1) NOT NULL,
	codigotabctbfismonofasico int2 NULL,
	considerarrateiooutrasdespesas bpchar(1) NULL,
	apuracreditopresumidosn bpchar(1) NOT NULL,
	codigotabctbfiscredpressn int2 NULL,
	calculadirbi int2 NOT NULL,
	detalhardimob bpchar(1) NOT NULL,
	CONSTRAINT pkcfop PRIMARY KEY (codigoempresa, codigoestab, codigocfop)
);
CREATE INDEX fkcfopcfgestabfis ON public.cfop USING btree (codigoempresa, codigoestab);
CREATE INDEX fkcfoptabctbfiscofins ON public.cfop USING btree (codigoempresa, codigotabctbfiscofins);
CREATE INDEX fkcfoptabctbfisconfisret ON public.cfop USING btree (codigoempresa, codigotabctbfiscofinsret);
CREATE INDEX fkcfoptabctbfiscsllret ON public.cfop USING btree (codigoempresa, codigotabctbfiscsllret);
CREATE INDEX fkcfoptabctbfisfunrural ON public.cfop USING btree (codigoempresa, codigotabctbfisfunrural);
CREATE INDEX fkcfoptabctbfisicms ON public.cfop USING btree (codigoempresa, codigotabctbfisicms);
CREATE INDEX fkcfoptabctbfisinssret ON public.cfop USING btree (codigoempresa, codigotabctbfisinssret);
CREATE INDEX fkcfoptabctbfisipi ON public.cfop USING btree (codigoempresa, codigotabctbfisipi);
CREATE INDEX fkcfoptabctbfisirpjret ON public.cfop USING btree (codigoempresa, codigotabctbfisirpjret);
CREATE INDEX fkcfoptabctbfisirrfret ON public.cfop USING btree (codigoempresa, codigotabctbfisirrfret);
CREATE INDEX fkcfoptabctbfisiss ON public.cfop USING btree (codigoempresa, codigotabctbfisiss);
CREATE INDEX fkcfoptabctbfisissqnret ON public.cfop USING btree (codigoempresa, codigotabctbfisissqnret);
CREATE INDEX fkcfoptabctbfispis ON public.cfop USING btree (codigoempresa, codigotabctbfispis);
CREATE INDEX fkcfoptabctbfispisret ON public.cfop USING btree (codigoempresa, codigotabctbfispisret);
CREATE INDEX fkcfoptabctbfissubstribut ON public.cfop USING btree (codigoempresa, codigotabctbfissubtribut);
CREATE INDEX fkcfoptabctbfisvlrcontabil ON public.cfop USING btree (codigoempresa, codigotabctbfisvlrcontabil);


-- public.cfop chaves estrangeiras

ALTER TABLE public.cfop ADD CONSTRAINT fkcfopcfgestabfis FOREIGN KEY (codigoempresa,codigoestab) REFERENCES public.cfgestabfis(codigoempresa,codigoestab);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfiscofins FOREIGN KEY (codigoempresa,codigotabctbfiscofins) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfisconfisret FOREIGN KEY (codigoempresa,codigotabctbfiscofinsret) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfiscsllret FOREIGN KEY (codigoempresa,codigotabctbfiscsllret) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfisfunrural FOREIGN KEY (codigoempresa,codigotabctbfisfunrural) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfisicms FOREIGN KEY (codigoempresa,codigotabctbfisicms) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfisinssret FOREIGN KEY (codigoempresa,codigotabctbfisinssret) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfisipi FOREIGN KEY (codigoempresa,codigotabctbfisipi) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfisirpjret FOREIGN KEY (codigoempresa,codigotabctbfisirpjret) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfisirrfret FOREIGN KEY (codigoempresa,codigotabctbfisirrfret) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfisiss FOREIGN KEY (codigoempresa,codigotabctbfisiss) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfisissqnret FOREIGN KEY (codigoempresa,codigotabctbfisissqnret) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfispis FOREIGN KEY (codigoempresa,codigotabctbfispis) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfispisret FOREIGN KEY (codigoempresa,codigotabctbfispisret) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfissubstribut FOREIGN KEY (codigoempresa,codigotabctbfissubtribut) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);
ALTER TABLE public.cfop ADD CONSTRAINT fkcfoptabctbfisvlrcontabil FOREIGN KEY (codigoempresa,codigotabctbfisvlrcontabil) REFERENCES public.tabelactbfis(codigoempresa,codigotabctbfis);