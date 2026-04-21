declare module 'mammoth/mammoth.browser' {
  interface ExtractionResult {
    value: string
    messages: unknown[]
  }
  export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<ExtractionResult>
  export function convertToHtml(options: { arrayBuffer: ArrayBuffer }): Promise<ExtractionResult>
}
