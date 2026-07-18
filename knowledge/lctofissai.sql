-- public.lctofissai definição

-- Drop table

-- DROP TABLE public.lctofissai;

CREATE TABLE public.lctofissai (
	codigoempresa int2 NOT NULL,
	chavelctofissai int8 NOT NULL,
	codigoestab int2 NOT NULL,
	codigopessoa int4 NOT NULL,
	numeronf int4 NOT NULL,
	numeronffinal int4 NOT NULL,
	especienf varchar(8) NOT NULL,
	serienf varchar(4) NULL,
	subserienf varchar(3) NULL,
	datalctofis date NOT NULL,
	valorcontabil numeric(16, 2) NOT NULL,
	basecalculoipi numeric(16, 2) NOT NULL,
	valoripi numeric(16, 2) NOT NULL,
	isentasipi numeric(16, 2) NOT NULL,
	outrasipi numeric(16, 2) NOT NULL,
	contribuinte bpchar(1) NOT NULL,
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
	acrescimofinanceiro numeric(16, 2) NOT NULL,
	cdmodelo varchar(2) NULL,
	chavenfesai varchar(44) NULL,
	chavenfesairef varchar(44) NULL,
	versaonfe varchar(4) NULL,
	codigosat int2 NULL,
	emitentenf bpchar(1) NOT NULL,
	finalidadeoperacao bpchar(1) NOT NULL,
	indpagto varchar(1) NULL,
	meiopagamento int2 NOT NULL,
	modalidadefrete int2 NULL,
	cdsituacao int2 NULL,
	cancelada bpchar(1) NOT NULL,
	conciliada bpchar(1) NOT NULL,
	desfeitonegocio bpchar(1) NULL,
	adicionaliss varchar(50) NULL,
	codigoreducaoz int4 NULL,
	codigousuario int2 NULL,
	datahoralctofis timestamp NOT NULL,
	chaveorigem varchar(25) NULL,
	dataprestacaoservico date NULL,
	origemdado int2 NOT NULL,
	idsyn int4 NULL,
	codigoestabscp int2 NULL,
	indicadorpresenca int2 NULL,
	tipocte int2 NULL,
	chavenfsesai varchar(50) NULL,
	siglaestadofatogerador bpchar(2) NULL,
	codigomunicfatogerador int2 NULL,
	finalidadeemissaonf varchar(1) NULL,
	tiponotadebito varchar(1) NULL,
	tipoentegov varchar(1) NULL,
	percentualreducaoaliqgov numeric(7, 2) NULL,
	tiponotacredito varchar(1) NULL,
	possuiantecipacao int2 NULL,
	destinatariort int4 NULL,
	indicadoroperacaort varchar(6) NULL,
	CONSTRAINT pklctofissai PRIMARY KEY (codigoempresa, chavelctofissai)
);
CREATE INDEX fklctofissaicfgestabfis ON public.lctofissai USING btree (codigoempresa, codigoestab);
CREATE INDEX fklctofissaiequipamentosat ON public.lctofissai USING btree (codigoempresa, codigoestab, codigosat);
CREATE INDEX fklctofissaiestado ON public.lctofissai USING btree (siglaestadoorigem);
CREATE INDEX fklctofissaihistoricofis ON public.lctofissai USING btree (codigohistfis);
CREATE INDEX fklctofissailctofissaireducaoz ON public.lctofissai USING btree (codigoempresa, codigoreducaoz);
CREATE INDEX fklctofissaimodelo ON public.lctofissai USING btree (cdmodelo);
CREATE INDEX fklctofissaimunicipio ON public.lctofissai USING btree (siglaestadoorigem, codigomunicorigem);
CREATE INDEX fklctofissaipessoa ON public.lctofissai USING btree (codigopessoa);
CREATE INDEX fklctofissaiscpcfgestabfis ON public.lctofissai USING btree (codigoempresa, codigoestabscp);
CREATE INDEX fklctofissaitipodctosintegra ON public.lctofissai USING btree (codigotipodctosintegra);
CREATE INDEX ixlctofissai ON public.lctofissai USING btree (codigoempresa, codigoestab, datalctofis);
CREATE INDEX ixlctofissaichave ON public.lctofissai USING btree (chavelctofissai DESC);
CREATE INDEX ixlctofissaichavenfesai ON public.lctofissai USING btree (chavenfesai);
CREATE INDEX ixlctofissaichaveorigem ON public.lctofissai USING btree (codigoempresa, chaveorigem);
CREATE INDEX ixlctofissaidupdoc ON public.lctofissai USING btree (codigoempresa, codigoestab, numeronf, especienf, serienf, subserienf);
CREATE INDEX ixlctofissainumeronf ON public.lctofissai USING btree (numeronf, especienf, serienf, subserienf, chavenfesai);

-- Table Triggers

create trigger lctofissaibi before
insert
    on
    public.lctofissai for each row execute function lctofissaibif();


-- public.lctofissai chaves estrangeiras

ALTER TABLE public.lctofissai ADD CONSTRAINT fklctofissaicfgestabfis FOREIGN KEY (codigoempresa,codigoestab) REFERENCES public.cfgestabfis(codigoempresa,codigoestab);
ALTER TABLE public.lctofissai ADD CONSTRAINT fklctofissaiequipamentosat FOREIGN KEY (codigoempresa,codigoestab,codigosat) REFERENCES public.equipamentosat(codigoempresa,codigoestab,codigosat);
ALTER TABLE public.lctofissai ADD CONSTRAINT fklctofissaiestado FOREIGN KEY (siglaestadoorigem) REFERENCES public.estado(siglaestado);
ALTER TABLE public.lctofissai ADD CONSTRAINT fklctofissaihistoricofis FOREIGN KEY (codigohistfis) REFERENCES public.historicofis(codigohistfis);
ALTER TABLE public.lctofissai ADD CONSTRAINT fklctofissailctofissaireducaoz FOREIGN KEY (codigoempresa,codigoreducaoz) REFERENCES public.lctofissaireducaoz(codigoempresa,codigoreducaoz) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.lctofissai ADD CONSTRAINT fklctofissaimodelo FOREIGN KEY (cdmodelo) REFERENCES public.modelodocumentosped(codigomodelo);
ALTER TABLE public.lctofissai ADD CONSTRAINT fklctofissaimunicipio FOREIGN KEY (siglaestadoorigem,codigomunicorigem) REFERENCES public.municipio(siglaestado,codigomunic);
ALTER TABLE public.lctofissai ADD CONSTRAINT fklctofissaipessoa FOREIGN KEY (codigopessoa) REFERENCES public.pessoa(codigopessoa);
ALTER TABLE public.lctofissai ADD CONSTRAINT fklctofissaiscpcfgestabfis FOREIGN KEY (codigoempresa,codigoestabscp) REFERENCES public.cfgestabfis(codigoempresa,codigoestab);
ALTER TABLE public.lctofissai ADD CONSTRAINT fklctofissaitipodctosintegra FOREIGN KEY (codigotipodctosintegra) REFERENCES public.tipodctosintegra(codigotipodctosintegra);