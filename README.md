# LazyDog Project
flowchart TD
    %% 配置节点
    config[apiConfig.js\nAPI_TYPES & DEFAULT_API] --> localStorage[(localStorage\ncurrentApiType)]
    config --> aiManagement

    %% 核心服务层
    aiManagement[aiManagement.js\ncallAI & formatResponse] --> geminiApi[callGeminiApi]
    aiManagement --> glmApi[callGlmApi]
    aiManagement --> mistralApi[callMistralApi]

    %% 业务逻辑层
    utils[utils.js\noptimizeText] --> aiManagement
    mindmapUtil[MindMapUtil.js\ngenerateMindMapFromText] --> aiManagement
    
    %% 组件层
    speechRecog[SpeechRecognition.js] --> useOptimization
    useOptimization[useOptimization.js] --> utils
    mindmap[MindMapContainer.js] --> mindmapUtil
    
    %% 数据流方向
    localStorage -.-> aiManagement
    
    %% 结果输出
    utils --> optimizedText[OptimizedText.js]
    mindmapUtil --> mindmapSvg[思维导图 SVG]

    %% 样式
    classDef config fill:#f9f,stroke:#333,stroke-width:2px
    classDef service fill:#bbf,stroke:#333,stroke-width:1px
    classDef component fill:#bfb,stroke:#333,stroke-width:1px
    classDef storage fill:#ffa,stroke:#333,stroke-width:1px
    classDef output fill:#fdf,stroke:#333,stroke-width:1px
    
    class config config
    class aiManagement,geminiApi,glmApi,mistralApi service
    class utils,mindmapUtil,useOptimization,speechRecog,mindmap component
    class localStorage storage
    class optimizedText,mindmapSvg output