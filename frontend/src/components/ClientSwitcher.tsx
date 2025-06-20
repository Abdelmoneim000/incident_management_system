import { ChevronDown } from 'lucide-react'
import { Client } from '../types'

interface ClientSwitcherProps {
  clients: Client[]
  selectedClient: Client
  onClientChange: (client: Client) => void
}

export default function ClientSwitcher({ clients, selectedClient, onClientChange }: ClientSwitcherProps) {
  return (
    <div className="relative">
      <select
        value={selectedClient.id}
        onChange={(e) => {
          const client = clients.find(c => c.id === e.target.value)
          if (client) onClientChange(client)
        }}
        className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  )
}
