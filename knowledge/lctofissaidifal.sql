-- public.lctofissaidifal definição

-- Drop table

-- DROP TABLE public.lctofissaidifal;

CREATE TABLE public.lctofissaidifal (
	codigoempresa int2 NOT NULL,
	chavelctofissai int8 NOT NULL,
	seq int2 NOT NULL,
	codigoestab int2 NOT NULL,
	datalctofis date NOT NULL,
	codigoproduto numeric(15) NULL,
	siglaestadodest bpchar(2) NOT NULL,
	vlrbcufdest numeric(16, 2) NULL,
	percfcpufdest numeric(11, 4) NULL,
	aliqicmsufdest numeric(11, 4) NULL,
	aliqicmsint numeric(7, 2) NULL,
	percparticmsint numeric(11, 4) NULL,
	vlricmsfcpufdest numeric(16, 2) NOT NULL,
	vlricmsintufdest numeric(16, 2) NOT NULL,
	vlricmsintufrem numeric(16, 2) NOT NULL,
	CONSTRAINT pklctofissaidifal PRIMARY KEY (codigoempresa, chavelctofissai, seq)
);
CREATE INDEX fklctofissaidifalestado ON public.lctofissaidifal USING btree (siglaestadodest);
CREATE INDEX fklctofissaidifallctofisent ON public.lctofissaidifal USING btree (codigoempresa, chavelctofissai);
CREATE INDEX fklctofissaidifalproduto ON public.lctofissaidifal USING btree (codigoempresa, codigoproduto);


-- public.lctofissaidifal chaves estrangeiras

ALTER TABLE public.lctofissaidifal ADD CONSTRAINT fklctofissaidifalestado FOREIGN KEY (siglaestadodest) REFERENCES public.estado(siglaestado);
ALTER TABLE public.lctofissaidifal ADD CONSTRAINT fklctofissaidifallctofisent FOREIGN KEY (codigoempresa,chavelctofissai) REFERENCES public.lctofissai(codigoempresa,chavelctofissai) ON DELETE CASCADE;
ALTER TABLE public.lctofissaidifal ADD CONSTRAINT fklctofissaidifalproduto FOREIGN KEY (codigoempresa,codigoproduto) REFERENCES public.produto(codigoempresa,codigoproduto);