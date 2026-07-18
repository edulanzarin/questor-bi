-- public.pessoa definição

-- Drop table

-- DROP TABLE public.pessoa;

CREATE TABLE public.pessoa (
	codigopessoa int4 NOT NULL,
	nomepessoa varchar(50) NOT NULL,
	tipoinscr int2 NOT NULL,
	inscrfederal varchar(18) NOT NULL,
	datanasc date NULL,
	sequencia int4 NOT NULL,
	suframa varchar(9) NULL,
	logradpessoa varchar(15) NULL,
	enderecopessoa varchar(40) NULL,
	numenderpessoa int4 NULL,
	complenderpessoa varchar(20) NULL,
	bairroenderpessoa varchar(30) NULL,
	siglaestado bpchar(2) NOT NULL,
	codigomunic int2 NULL,
	cependerpessoa varchar(10) NULL,
	dddfone int2 NULL,
	tipofornecedor int2 NOT NULL,
	numerofone int4 NULL,
	aliqsimplesnacional numeric(7, 2) NOT NULL,
	produtrural bpchar(1) NOT NULL,
	inscrprod varchar(25) NULL,
	inscrestad varchar(25) NULL,
	inscrmunic varchar(25) NULL,
	codigoativfederal varchar(9) NULL,
	email varchar(100) NULL,
	paginainternet varchar(100) NULL,
	formaduplicataparcela int2 NULL,
	codigousuario int2 NULL,
	datahoralcto timestamp NULL,
	origemdado int2 NULL,
	orgaopublico int2 NULL,
	contribuinte bpchar(1) NULL,
	indicativoisencaoimunidade int2 NULL,
	CONSTRAINT ixpessoainscrfederalestado UNIQUE (inscrfederal, sequencia, siglaestado),
	CONSTRAINT pkpessoa PRIMARY KEY (codigopessoa)
);
CREATE INDEX fkpessoaativfederal ON public.pessoa USING btree (codigoativfederal);
CREATE INDEX fkpessoaestado ON public.pessoa USING btree (siglaestado);
CREATE INDEX fkpessoamunicipio ON public.pessoa USING btree (siglaestado, codigomunic);
CREATE INDEX idx_pessoa_001 ON public.pessoa USING btree (nomepessoa);
CREATE INDEX ixpessoachave ON public.pessoa USING btree (codigopessoa DESC);
CREATE INDEX ixpessoainscfedsiglaest ON public.pessoa USING btree (inscrfederal, siglaestado);
CREATE INDEX ixpessoainscrestad ON public.pessoa USING btree (inscrestad);
CREATE INDEX ixpessoainscrfederal ON public.pessoa USING btree (inscrfederal);

-- Table Triggers

create trigger pessoabi before
insert
    on
    public.pessoa for each row execute function pessoabif();


-- public.pessoa chaves estrangeiras

ALTER TABLE public.pessoa ADD CONSTRAINT fkpessoaativfederal FOREIGN KEY (codigoativfederal) REFERENCES public.ativfederal(codigoativfederal);
ALTER TABLE public.pessoa ADD CONSTRAINT fkpessoaestado FOREIGN KEY (siglaestado) REFERENCES public.estado(siglaestado);
ALTER TABLE public.pessoa ADD CONSTRAINT fkpessoamunicipio FOREIGN KEY (siglaestado,codigomunic) REFERENCES public.municipio(siglaestado,codigomunic);