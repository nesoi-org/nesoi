
export type MonolythBundlerConfig = {
    libPaths?: string[],
    staticPaths?: string[],
    scripts?: Record<string, string>
    nesoiPath?: string
    nesoiVersion?: string
}