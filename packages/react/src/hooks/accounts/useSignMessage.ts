import * as React from 'react'
import { Bytes } from 'ethers/lib/utils'
import { ConnectorNotFoundError, UserRejectedRequestError } from 'wagmi-private'

import { useContext } from '../../context'

export type Config = {
  message?: Bytes | string
}

type State = {
  signature?: string
  error?: Error
  loading?: boolean
}

const initialState: State = {
  loading: false,
}

export const useSignMessage = ({ message }: Config = {}) => {
  const {
    state: { connector },
  } = useContext()
  const [state, setState] = React.useState<State>(initialState)

  const signMessage = React.useCallback(
    async (config?: { message?: Config['message'] }) => {
      try {
        const _config = config ?? { message }
        if (!_config.message) throw new Error('message is required')
        if (!connector) throw new ConnectorNotFoundError()

        setState((x) => ({ ...x, error: undefined, loading: true }))
        const signer = await connector.getSigner()
        const signature = await signer.signMessage(_config.message)
        setState((x) => ({ ...x, signature, loading: false }))
        return signature
      } catch (err) {
        let error: Error = <Error>err
        if ((<ProviderRpcError>err).code === 4001)
          error = new UserRejectedRequestError()
        setState((x) => ({ ...x, error, loading: false }))
        return error
      }
    },
    [connector, message],
  )

  return [
    {
      data: state.signature,
      error: state.error,
      loading: state.loading,
    },
    signMessage,
  ] as const
}
