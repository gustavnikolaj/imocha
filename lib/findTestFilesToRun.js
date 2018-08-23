module.exports = async function findTestFilesToRun(sourceGraph, gitClient) {
  const dirtyFiles = await gitClient.listDirtyFiles();
  const dirtySourceFiles = dirtyFiles.reduce((files, path) => {
    const result = sourceGraph.query({ type: "file", path });

    if (result) {
      files.push(path);
    }

    return files;
  }, []);

  const filesToProcess = new Set(dirtySourceFiles);
  const processedFiles = new Set();
  const relatedTestFiles = new Set();

  while (filesToProcess.size > 0) {
    for (const path of filesToProcess.keys()) {
      filesToProcess.delete(path);
      if (processedFiles.has(path)) {
        continue;
      }
      processedFiles.add(path);

      const sourceFile = sourceGraph.query({ type: "file", path });

      if (sourceFile.isTestFile) {
        relatedTestFiles.add(path);
        // We don't need to look for relations to the source files. If they are
        // changed they need to be run.
        continue;
      }

      for (const { from: relatedFile } of sourceFile.incomingRelations) {
        filesToProcess.add(relatedFile);
      }
    }
  }

  return [...relatedTestFiles];
};
