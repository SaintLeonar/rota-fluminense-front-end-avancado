const DEFAULT_DELAY_MS = 500
const DEFAULT_ERROR_MESSAGE = 'Nao foi possivel carregar os dados no momento.'

export function simulateAsyncResult(data, options = {}) {
  const {
    delayMs = DEFAULT_DELAY_MS,
    shouldFail = false,
    errorMessage = DEFAULT_ERROR_MESSAGE,
  } = options

  return new Promise((resolve, reject) => {
    // O setTimeout mantem o estado de carregamento visivel antes do retorno.
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(errorMessage))
        return
      }

      resolve(data)
    }, delayMs)
  })
}
