interface PullResponse {
    status: string,
    digest: string | null,
    total: number | null,
    completed: number | null,
}
