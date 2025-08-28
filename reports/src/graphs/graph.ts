export interface Graph {
    id: string; // Value of the option
    displayName: string;    // Displayed text for the option
    configFieldIDs: string[];    // Array of IDs for the config fields
    setConfigs(useURLParams?: boolean): void;  // Set the configuration fields
    generatePlot(configValues: any, plotContainerID: string): void;  // Kicks of data gathering then creates the plot as a child of "plotContainerID". configValues have values corresponding to keys in configFieldIDs. Needs to be async
}