/// <reference path="./custom.d.ts" />
// tslint:disable
/**
 * Management as Code Documents API
 * API del modulo documentale key-scoped di Management as Code.
 *
 * NOTE: This file is generated from the OpenAPI contract.
 */

import { Configuration } from "./configuration";

const BASE_PATH = "http://localhost:3000".replace(/\/+$/, "");

export interface FetchAPI {
    (url: string, init?: any): Promise<Response>;
}

export class BaseAPI {
    protected configuration: Configuration;

    constructor(configuration?: Configuration, protected basePath: string = BASE_PATH, protected fetch: FetchAPI = fetch) {
        if (configuration) {
            this.configuration = configuration;
            this.basePath = configuration.basePath || this.basePath;
        }
    }

    protected request<T>(path: string, options: any = {}): Promise<T> {
        return this.fetch(this.basePath + path, options).then((response) => {
            if (response.status >= 200 && response.status < 300) {
                return response.json();
            }

            throw response;
        });
    }
}

export interface ApiError {
    code: string;
    message: string;
}

export interface HealthResponse {
    status: string;
    timestamp: Date;
}

export interface DocumentStatusSummary {
    draft: number;
    in_review: number;
    approved: number;
    archived: number;
}

export interface DocumentTag {
    name: string;
}

export interface DocumentOwner {
    id: string;
    name: string;
}

export interface DocumentMetadata {
    title: string;
    description?: string;
    templateId?: string;
    templateName?: string;
    owner?: {
        id?: string;
        name?: string;
        email?: string;
        source?: string;
    };
    source?: { [key: string]: any };
    [key: string]: any;
}

export interface KeyRef {
    id: string;
    name: string;
}

export interface ParentSubKeyRef {
    id: string;
    name: string;
}

export interface SubKeyRef {
    id: string;
    name: string;
    parentSubKey: ParentSubKeyRef | null;
}

export interface FileInfo {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
}

export interface DocumentListItem {
    id: string;
    documentKey: string;
    metadata: DocumentMetadata;
    title: string;
    description?: string;
    status: DocumentListItem.StatusEnum;
    version: number;
    checksumSha256: string;
    updatedAt: Date | null;
    owner: DocumentOwner;
    tags: Array<DocumentTag>;
}

export namespace DocumentListItem {
    export enum StatusEnum {
        Draft = <any> 'draft',
        InReview = <any> 'in_review',
        Approved = <any> 'approved',
        Archived = <any> 'archived'
    }
}

export interface DocumentDetail extends DocumentListItem {
    keyType: string;
    key: KeyRef;
    subKey: SubKeyRef;
    fileInfo: FileInfo;
    createdAt: Date;
    archivedAt: Date | null;
}

export namespace DocumentDetail {
    export enum StatusEnum {
        Draft = <any> 'draft',
        InReview = <any> 'in_review',
        Approved = <any> 'approved',
        Archived = <any> 'archived'
    }
}

export interface DocumentDetailResponse {
    data: DocumentDetail;
}

export interface DocumentVersion {
    documentId: string;
    version: number;
    fileInfo: FileInfo;
    checksumSha256: string;
    createdAt: Date;
}

export interface DocumentVersionsResponse {
    data: Array<DocumentVersion>;
}

export interface DocumentSubKeyGroup {
    keyType: string;
    key: KeyRef;
    subKey: SubKeyRef;
    documentCount: number;
    statusSummary: DocumentStatusSummary;
    documents: Array<DocumentListItem>;
}

export interface DocumentHomeMeta {
    totalSubKeys: number;
    totalDocuments: number;
}

export interface DocumentHomeResponse {
    data: Array<DocumentSubKeyGroup>;
    meta: DocumentHomeMeta;
}

export interface DocumentTreeSubKey {
    keyType: string;
    key: KeyRef;
    subKey: SubKeyRef;
    documentCount: number;
    statusSummary: DocumentStatusSummary;
}

export interface DocumentTreeMeta {
    totalSubKeys: number;
    totalDocuments: number;
}

export interface DocumentTreeResponse {
    data: Array<DocumentTreeSubKey>;
    meta: DocumentTreeMeta;
}

export interface CreateDocumentRequest {
    file: Blob;
    fileName?: string;
    subKey: string;
    documentKey: string;
    metadata?: DocumentMetadata | string;
    templateId?: string;
    templateName?: string;
    title?: string;
    description?: string | null;
    ownerId: string;
    status?: CreateDocumentRequest.StatusEnum;
    tags?: Array<string>;
}

export namespace CreateDocumentRequest {
    export enum StatusEnum {
        Draft = <any> 'draft',
        InReview = <any> 'in_review',
        Approved = <any> 'approved'
    }
}

export interface UpdateDocumentRequest {
    metadata?: Partial<DocumentMetadata>;
    title?: string;
    description?: string;
    status?: UpdateDocumentRequest.StatusEnum;
}

export namespace UpdateDocumentRequest {
    export enum StatusEnum {
        Draft = <any> 'draft',
        InReview = <any> 'in_review',
        Approved = <any> 'approved'
    }
}

export class HealthApi extends BaseAPI {
    public healthControllerGetHealth(options?: any): Promise<HealthResponse> {
        return this.request<HealthResponse>("/api/v1/health", Object.assign({ method: "GET" }, options));
    }
}

export class DocumentKeysApi extends BaseAPI {
    public documentKeysControllerGetDocumentTree(keyType: string, key: string, options?: any): Promise<DocumentTreeResponse> {
        return this.request<DocumentTreeResponse>(
            `/api/v1/document-keys/${encodeURIComponent(keyType)}/${encodeURIComponent(key)}/document-tree`,
            Object.assign({ method: "GET" }, options),
        );
    }

    public documentKeysControllerListDocuments(
        keyType: string,
        key: string,
        search?: string,
        status?: string,
        tag?: string,
        ownerId?: string,
        subKey?: string,
        options: any = {},
    ): Promise<DocumentHomeResponse> {
        const query = new URLSearchParams();
        if (search !== undefined) query.set("search", search);
        if (status !== undefined) query.set("status", status);
        if (tag !== undefined) query.set("tag", tag);
        if (ownerId !== undefined) query.set("ownerId", ownerId);
        if (subKey !== undefined) query.set("subKey", subKey);
        if (options.query) {
            for (const [name, value] of Object.entries(options.query)) {
                query.set(name, String(value));
            }
        }

        const suffix = query.toString() ? `?${query.toString()}` : "";
        return this.request<DocumentHomeResponse>(
            `/api/v1/document-keys/${encodeURIComponent(keyType)}/${encodeURIComponent(key)}/documents${suffix}`,
            Object.assign({ method: "GET" }, options),
        );
    }

    public documentKeysControllerCreateDocument(body: CreateDocumentRequest, keyType: string, key: string, options?: any): Promise<DocumentDetailResponse> {
        const formData = new FormData();
        formData.append("file", body.file, body.fileName || "document");
        formData.append("subKey", body.subKey);
        formData.append("documentKey", body.documentKey);
        if (body.metadata !== undefined) {
            formData.append("metadata", typeof body.metadata === "string" ? body.metadata : JSON.stringify(body.metadata));
        }
        if (body.templateId !== undefined) formData.append("templateId", body.templateId);
        if (body.templateName !== undefined) formData.append("templateName", body.templateName);
        if (body.title !== undefined) formData.append("title", body.title);
        formData.append("ownerId", body.ownerId);
        if (body.description !== undefined && body.description !== null) formData.append("description", body.description);
        if (body.status !== undefined) formData.append("status", String(body.status));
        for (const tag of body.tags || []) formData.append("tags", tag);

        return this.request<DocumentDetailResponse>(
            `/api/v1/document-keys/${encodeURIComponent(keyType)}/${encodeURIComponent(key)}/documents`,
            Object.assign({ method: "POST", body: formData }, options),
        );
    }

    public documentKeysControllerGetDocumentById(documentId: string, keyType: string, key: string, options?: any): Promise<DocumentDetailResponse> {
        return this.request<DocumentDetailResponse>(
            `/api/v1/document-keys/${encodeURIComponent(keyType)}/${encodeURIComponent(key)}/documents/${encodeURIComponent(documentId)}`,
            Object.assign({ method: "GET" }, options),
        );
    }

    public documentKeysControllerGetDocumentVersions(documentId: string, keyType: string, key: string, options?: any): Promise<DocumentVersionsResponse> {
        return this.request<DocumentVersionsResponse>(
            `/api/v1/document-keys/${encodeURIComponent(keyType)}/${encodeURIComponent(key)}/documents/${encodeURIComponent(documentId)}/versions`,
            Object.assign({ method: "GET" }, options),
        );
    }

    public documentKeysControllerDownloadDocumentVersionFile(documentId: string, version: number, keyType: string, key: string, options?: any): Promise<Blob> {
        return this.fetch(
            this.basePath + `/api/v1/document-keys/${encodeURIComponent(keyType)}/${encodeURIComponent(key)}/documents/${encodeURIComponent(documentId)}/versions/${encodeURIComponent(String(version))}/file`,
            Object.assign({ method: "GET" }, options),
        ).then((response) => {
            if (response.status >= 200 && response.status < 300) return response.blob();
            throw response;
        });
    }

    public documentKeysControllerDownloadDocumentFile(documentId: string, keyType: string, key: string, options?: any): Promise<Blob> {
        return this.fetch(
            this.basePath + `/api/v1/document-keys/${encodeURIComponent(keyType)}/${encodeURIComponent(key)}/documents/${encodeURIComponent(documentId)}/file`,
            Object.assign({ method: "GET" }, options),
        ).then((response) => {
            if (response.status >= 200 && response.status < 300) return response.blob();
            throw response;
        });
    }

    public documentKeysControllerUpdateDocument(body: UpdateDocumentRequest, documentId: string, keyType: string, key: string, options?: any): Promise<DocumentDetailResponse> {
        return this.request<DocumentDetailResponse>(
            `/api/v1/document-keys/${encodeURIComponent(keyType)}/${encodeURIComponent(key)}/documents/${encodeURIComponent(documentId)}`,
            Object.assign({ method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) }, options),
        );
    }

    public documentKeysControllerArchiveDocument(documentId: string, keyType: string, key: string, options?: any): Promise<DocumentDetailResponse> {
        return this.request<DocumentDetailResponse>(
            `/api/v1/document-keys/${encodeURIComponent(keyType)}/${encodeURIComponent(key)}/documents/${encodeURIComponent(documentId)}`,
            Object.assign({ method: "DELETE" }, options),
        );
    }
}
