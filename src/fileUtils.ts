import fs from 'fs/promises'

export const getOrCreateFile = async (path: string, array = false) => {
    try {
        await fs.access(path);
        return await fs.readFile(path, 'utf-8');
    }
    catch (error) {
        await createDirectoryPath(path);
        if (array) {
            await fs.writeFile(path, '[]');
        }
        else {
            await fs.writeFile(path, '{}');
        }
        return await fs.readFile(path, 'utf-8');
    }
}

export const createDirectoryPath = async (filePath: string) => {
    const lastIndex = filePath.lastIndexOf('\\');
    const directoryPath = filePath.substring(0, lastIndex);
    await fs.mkdir(directoryPath, { recursive: true });
}

export const setOrCreateFile = async (path: string, data: string) => {
    try {
        await fs.writeFile(path, data);
    }
    catch (error) {
        await createDirectoryPath(path);
        await fs.writeFile(path, data);
    }
}