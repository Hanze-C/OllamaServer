export const DEFAULT_TEMPLATE = `{{- range .Messages }}<|im_start|>{{ .Role }}
{{ .Content }}<|im_end|>
{{ end }}<|im_start|>assistant`
export const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant.`
