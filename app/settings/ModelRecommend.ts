export type ModelRecommend = {
    modelName: string;
    description: string;
}

export const modelRecommendList: ModelRecommend[] = [
    {
        modelName: 'deepseek-r1:1.5b',
        description: '1.1GB'
    },
    {
        modelName: 'llama3.2:1b',
        description: '1.3GB'
    },
    {
        modelName: 'qwen2.5:0.5b',
        description: '398MB'
    },
    {
        modelName: 'qwen2.5-coder:0.5b',
        description: '531MB'
    }
]
