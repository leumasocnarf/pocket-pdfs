--liquibase formatted sql

--changeset dev:1 labels:pdf_files context:ddl
--comment: Create pdf_files table
CREATE TABLE pdf_files
(
    id           UUID                     NOT NULL,
    file_name    VARCHAR(512)             NOT NULL,
    s3_key       VARCHAR(1024)            NOT NULL,
    size         BIGINT                   NOT NULL,
    content_type VARCHAR(128)             NOT NULL,
    uploaded_at  TIMESTAMP WITH TIME ZONE NOT NULL
);
ALTER TABLE pdf_files
    ADD CONSTRAINT pk_pdf_files PRIMARY KEY (id);
ALTER TABLE pdf_files
    ADD CONSTRAINT uq_pdf_files_s3_key UNIQUE (s3_key);
--rollback DROP TABLE pdf_files;