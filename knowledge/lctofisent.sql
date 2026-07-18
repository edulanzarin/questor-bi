-- public.lctofisent definição

-- Drop table

-- DROP TABLE public.lctofisent;

CREATE TABLE public.lctofisent (
	codigoempresa int2 NOT NULL,
	chavelctofisent int8 NOT NULL,
	codigoestab int2 NOT NULL,
	codigopessoa int4 NOT NULL,
	numeronf int4 NOT NULL,
	especienf varchar(8) NOT NULL,
	serienf varchar(4) NULL,
	subserienf varchar(3) NULL,
	dataentrada date NULL,
	datalctofis date NOT NULL,
	dataemissao date NOT NULL,
	valorcontabil numeric(16, 2) NOT NULL,
	basecalculoipi numeric(16, 2) NOT NULL,
	valoripi numeric(16, 2) NOT NULL,
	isentasipi numeric(16, 2) NOT NULL,
	outrasipi numeric(16, 2) NOT NULL,
	basecalculofunrural numeric(16, 2) NOT NULL,
	aliqfunrural numeric(7, 2) NOT NULL,
	valorfunrural numeric(16, 2) NOT NULL,
	siglaestadoorigem bpchar(2) NULL,
	codigomunicorigem int2 NULL,
	siglaestadodestino bpchar(2) NULL,
	codigomunicdestino int2 NULL,
	codigohistfis int2 NULL,
	complhist varchar(2000) NULL,
	codigotipodctosintegra int2 NOT NULL,
	vlrdesc numeric(17, 2) NULL,
	vlrabatntrib numeric(17, 2) NULL,
	vlrfrete numeric(17, 2) NULL,
	vlrpedagio numeric(17, 2) NULL,
	vlrseguro numeric(17, 2) NULL,
	vlroutrdesp numeric(17, 2) NULL,
	cdmodelo varchar(2) NULL,
	chavenfeent varchar(44) NULL,
	versaonfe varchar(4) NULL,
	chavenfeentref varchar(44) NULL,
	emitentenf bpchar(1) NULL,
	finalidadeoperacao bpchar(1) NOT NULL,
	indpagto varchar(1) NULL,
	meiopagamento int2 NOT NULL,
	modalidadefrete int2 NULL,
	cdsituacao int2 NULL,
	cancelada bpchar(1) NOT NULL,
	conciliada bpchar(1) NOT NULL,
	adicionaliss varchar(50) NULL,
	codigousuario int2 NULL,
	datahoralctofis timestamp NOT NULL,
	chaveorigem varchar(25) NULL,
	origemdado int2 NOT NULL,
	idsyn int4 NULL,
	tipocte int2 NULL,
	chavenfseent varchar(50) NULL,
	siglaestadofatogerador bpchar(2) NULL,
	codigomunicfatogerador int4 NULL,
	finalidadeemissaonf varchar(1) NULL,
	tiponotadebito varchar(1) NULL,
	tipoentegov varchar(1) NULL,
	percentualreducaoaliqgov numeric(7, 2) NULL,
	tiponotacredito varchar(1) NULL,
	possuiantecipacao int2 NULL,
	destinatariort int4 NULL,
	indicadoroperacaort varchar(6) NULL,
	CONSTRAINT pklctofisent PRIMARY KEY (codigoempresa, chavelctofisent)
);
CREATE INDEX fklctofisentcfgestabfis ON public.lctofisent USING btree (codigoempresa, codigoestab);
CREATE INDEX fklctofisentcfopestado ON public.lctofisent USING btree (siglaestadoorigem);
CREATE INDEX fklctofisenthistoricofis ON public.lctofisent USING btree (codigohistfis);
CREATE INDEX fklctofisentmodelo ON public.lctofisent USING btree (cdmodelo);
CREATE INDEX fklctofisentpessoa ON public.lctofisent USING btree (codigopessoa);
CREATE INDEX fklctofisenttipodctosintegra ON public.lctofisent USING btree (codigotipodctosintegra);
CREATE INDEX ixlctofisent ON public.lctofisent USING btree (codigoempresa, codigoestab, datalctofis);
CREATE INDEX ixlctofisentchave ON public.lctofisent USING btree (chavelctofisent DESC);
CREATE INDEX ixlctofisentchavenfeent ON public.lctofisent USING btree (chavenfeent);
CREATE INDEX ixlctofisentchaveorigem ON public.lctofisent USING btree (codigoempresa, chaveorigem);
CREATE INDEX ixlctofisentdupdoc ON public.lctofisent USING btree (codigoempresa, codigoestab, codigopessoa, numeronf, especienf, serienf, subserienf);

-- Table Triggers

create trigger lctofisentbi before
insert
    on
    public.lctofisent for each row execute function lctofisentbif();


-- public.lctofisent chaves estrangeiras

ALTER TABLE public.lctofisent ADD CONSTRAINT fklctofisentcfgestabfis FOREIGN KEY (codigoempresa,codigoestab) REFERENCES public.cfgestabfis(codigoempresa,codigoestab);
ALTER TABLE public.lctofisent ADD CONSTRAINT fklctofisentcfopestado FOREIGN KEY (siglaestadoorigem) REFERENCES public.estado(siglaestado);
ALTER TABLE public.lctofisent ADD CONSTRAINT fklctofisenthistoricofis FOREIGN KEY (codigohistfis) REFERENCES public.historicofis(codigohistfis);
ALTER TABLE public.lctofisent ADD CONSTRAINT fklctofisentmodelo FOREIGN KEY (cdmodelo) REFERENCES public.modelodocumentosped(codigomodelo) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.lctofisent ADD CONSTRAINT fklctofisentpessoa FOREIGN KEY (codigopessoa) REFERENCES public.pessoa(codigopessoa);
ALTER TABLE public.lctofisent ADD CONSTRAINT fklctofisenttipodctosintegra FOREIGN KEY (codigotipodctosintegra) REFERENCES public.tipodctosintegra(codigotipodctosintegra);