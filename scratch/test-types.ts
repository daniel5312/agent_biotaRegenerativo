import { useBalance } from 'wagmi'
import { type Address } from 'viem'

export function Test() {
  const { data } = useBalance({
    address: '0x0' as Address,
    // @ts-expect-error
    token: '0x0' as Address,
  })
}
