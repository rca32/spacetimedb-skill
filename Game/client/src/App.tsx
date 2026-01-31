import { useEffect, useState, useCallback, useRef } from 'react'
import { DbConnection } from './generated'

// Hex grid constants
const HEX_SIZE = 30
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE

// Type aliases for row types
interface PlayerState {
  entityId: bigint
  identity: { toHexString: () => string }
  regionId: bigint
  level: number
  hexQ: number
  hexR: number
  isOnline: boolean
}

interface WorldItem {
  worldItemId: bigint
  itemDefId: bigint
  quantity: number
  hexQ: number
  hexR: number
}

interface NpcState {
  npcId: bigint
  name: string
  npcType: number
  hexQ: number
  hexR: number
  status: number
}

interface ItemInstance {
  instanceId: bigint
  itemDefId: bigint
  quantity: number
  durability?: number
}

function App() {
  const [connected, setConnected] = useState(false)
  const [identity, setIdentity] = useState<string | null>(null)
  const [conn, setConn] = useState<DbConnection | null>(null)
  const [player, setPlayer] = useState<PlayerState | null>(null)
  const [allPlayers, setAllPlayers] = useState<PlayerState[]>([])
  const [worldItems, setWorldItems] = useState<WorldItem[]>([])
  const [npcs, setNpcs] = useState<NpcState[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [showInventory, setShowInventory] = useState(false)
  const [inventory, setInventory] = useState<ItemInstance[]>([])

  const addLog = useCallback((message: string) => {
    setLogs(prev => [message, ...prev.slice(0, 9)])
  }, [])

  // Use ref to track current identity for callbacks
  const identityRef = useRef<string | null>(null)
  const playerRef = useRef<PlayerState | null>(null)
  
  // Keep refs in sync with state
  useEffect(() => {
    identityRef.current = identity
  }, [identity])
  
  useEffect(() => {
    playerRef.current = player
  }, [player])

  useEffect(() => {
    // Create connection using the new SDK API
    const connection = DbConnection.builder()
      .withUri('ws://localhost:3000')
      .withModuleName('cozy-mmo')
      .onConnect((_ctx, newIdentity, _token) => {
        const identityStr = newIdentity.toHexString()
        setConnected(true)
        setIdentity(identityStr)
        identityRef.current = identityStr
        setConn(connection)
        addLog('Connected to server')
        
        // Set up player listeners here where identity is known
        connection.db.playerState.onInsert((_ctx, row) => {
          const playerRow = row as unknown as PlayerState
          // Track all players
          setAllPlayers(prev => [...prev, playerRow])
          // Track current player specifically
          if (playerRow.identity.toHexString() === identityRef.current) {
            setPlayer(playerRow)
            playerRef.current = playerRow
          }
        })

        connection.db.playerState.onUpdate((_ctx, _oldRow, newRow) => {
          const playerRow = newRow as unknown as PlayerState
          // Update in all players list
          setAllPlayers(prev => prev.map(p => 
            p.identity.toHexString() === playerRow.identity.toHexString() ? playerRow : p
          ))
          // Update current player specifically
          if (playerRow.identity.toHexString() === identityRef.current) {
            setPlayer(playerRow)
            playerRef.current = playerRow
          }
        })

        connection.db.playerState.onDelete((_ctx, row) => {
          const playerRow = row as unknown as PlayerState
          setAllPlayers(prev => prev.filter(p => 
            p.identity.toHexString() !== playerRow.identity.toHexString()
          ))
        })
        
        // Subscribe to game data
        connection.subscriptionBuilder()
          .onApplied(() => {
            addLog('Subscriptions applied')
          })
          .subscribe([
            'SELECT * FROM player_state',
            'SELECT * FROM world_item',
            'SELECT * FROM npc_state WHERE status = 1',
            'SELECT * FROM inventory_slot',
            'SELECT * FROM item_instance',
          ])
        
        // Create account and login
        createAccountAndLogin(connection)
      })
      .onDisconnect(() => {
        setConnected(false)
        addLog('Disconnected from server')
      })
      .onConnectError((_ctx, error) => {
        addLog(`Connection error: ${error}`)
      })
      .build()

    // Set up non-player-specific listeners
    connection.db.worldItem.onInsert((_ctx, row) => {
      setWorldItems(prev => [...prev, row as unknown as WorldItem])
    })

    connection.db.worldItem.onUpdate((_ctx, _oldRow, newRow) => {
      const item = newRow as unknown as WorldItem
      setWorldItems(prev => prev.map(i => i.worldItemId === item.worldItemId ? item : i))
    })

    connection.db.worldItem.onDelete((_ctx, row) => {
      const item = row as unknown as WorldItem
      setWorldItems(prev => prev.filter(i => i.worldItemId !== item.worldItemId))
    })

    connection.db.npcState.onInsert((_ctx, row) => {
      setNpcs(prev => [...prev, row as unknown as NpcState])
    })

    connection.db.npcState.onUpdate((_ctx, _oldRow, newRow) => {
      const npc = newRow as unknown as NpcState
      setNpcs(prev => prev.map(n => n.npcId === npc.npcId ? npc : n))
    })

    connection.db.npcState.onDelete((_ctx, row) => {
      const npc = row as unknown as NpcState
      setNpcs(prev => prev.filter(n => n.npcId !== npc.npcId))
    })

    connection.db.inventorySlot.onInsert((_ctx, row) => {
      const slot = row as { containerId: bigint, itemInstanceId?: bigint | null }
      const currentPlayer = playerRef.current
      if (currentPlayer && slot.containerId === currentPlayer.entityId) {
        updateInventoryDisplay(connection, currentPlayer.entityId)
      }
    })

    // Cleanup on unmount
    return () => {
      connection.disconnect()
    }
  }, [])

  const updateInventoryDisplay = (connection: DbConnection, entityId: bigint) => {
    // Get player's container
    for (const container of connection.db.inventoryContainer.iter()) {
      if ((container as { ownerEntityId: bigint }).ownerEntityId === entityId) {
        const containerId = (container as { containerId: bigint }).containerId
        const items: ItemInstance[] = []
        for (const slot of connection.db.inventorySlot.iter()) {
          const slotData = slot as { containerId: bigint, itemInstanceId?: bigint | null }
          if (slotData.containerId === containerId && slotData.itemInstanceId) {
            const instance = connection.db.itemInstance.instanceId.find(slotData.itemInstanceId)
            if (instance) {
              items.push(instance as unknown as ItemInstance)
            }
          }
        }
        setInventory(items)
        break
      }
    }
  }

  const createAccountAndLogin = async (connection: DbConnection) => {
    try {
      await connection.reducers.createAccount({})
      addLog('Account created')
      
      await connection.reducers.login({})
      addLog('Logged in successfully')
      
      // Spawn player
      await connection.reducers.spawnPlayer({ regionId: 1n })
      addLog('Player spawned in region 1')
    } catch (error) {
      console.log('Account may already exist, trying login...')
      try {
        await connection.reducers.login({})
        addLog('Logged in successfully')
        
        // Check if player needs spawning
        if (!player) {
          await connection.reducers.spawnPlayer({ regionId: 1n })
          addLog('Player spawned in region 1')
        }
      } catch (loginError) {
        console.error('Login failed:', loginError)
        addLog('Login failed')
      }
    }
  }

  const movePlayer = async (dq: number, dr: number) => {
    if (!conn) return
    
    const currentPlayer = playerRef.current
    if (!currentPlayer) {
      addLog('Cannot move: Player not loaded')
      return
    }
    
    const targetQ = currentPlayer.hexQ + dq
    const targetR = currentPlayer.hexR + dr
    
    try {
      await conn.reducers.movePlayer({ targetQ, targetR })
      addLog(`Moved to (${targetQ}, ${targetR})`)
    } catch (error) {
      addLog(`Move failed: ${error}`)
    }
  }

  const pickupItem = async (worldItemId: bigint) => {
    if (!conn) return
    
    try {
      await conn.reducers.pickupItem({ worldItemId })
      addLog(`Picked up item ${worldItemId.toString()}`)
    } catch (error) {
      addLog(`Pickup failed: ${error}`)
    }
  }

  const startConversation = async (npcId: bigint) => {
    if (!conn) return
    
    try {
      await conn.reducers.startConversation({ npcId })
      addLog(`Started conversation with NPC ${npcId.toString()}`)
    } catch (error) {
      addLog(`Conversation failed: ${error}`)
    }
  }

  // Hex grid calculations - camera centered on player
  const hexToPixel = (q: number, r: number) => {
    const x = HEX_SIZE * (3/2 * q)
    const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r)
    return { x, y }
  }

  const renderHexGrid = () => {
    const hexes = []
    const range = 5
    
    // Get camera offset (center on player, or 0,0 if no player)
    const cameraQ = player ? player.hexQ : 0
    const cameraR = player ? player.hexR : 0
    
    // Center of screen
    const centerX = 400
    const centerY = 300
    
    for (let q = -range; q <= range; q++) {
      for (let r = -range; r <= range; r++) {
        if (Math.abs(q + r) <= range) {
          // Calculate world coordinates
          const worldQ = cameraQ + q
          const worldR = cameraR + r
          
          // Calculate pixel position relative to center
          const { x, y } = hexToPixel(q, r)
          const screenX = x + centerX
          const screenY = y + centerY
          
          // Check for any player at this world hex
          const playersAtHex = allPlayers.filter(p => p.hexQ === worldQ && p.hexR === worldR)
          const isCurrentPlayer = player && player.hexQ === worldQ && player.hexR === worldR
          const isOtherPlayer = playersAtHex.length > 0 && !isCurrentPlayer
          
          const item = worldItems.find(i => i.hexQ === worldQ && i.hexR === worldR)
          const npc = npcs.find(n => n.hexQ === worldQ && n.hexR === worldR)
          
          // Determine fill color
          let fillColor = '#f0f0f0'
          if (isCurrentPlayer) fillColor = '#4CAF50'  // Green for current player
          else if (isOtherPlayer) fillColor = '#2196F3'  // Blue for other players
          else if (item) fillColor = '#FF9800'  // Orange for items
          else if (npc) fillColor = '#9C27B0'  // Purple for NPCs
          
          // Determine label
          let label = ''
          if (isCurrentPlayer) label = 'You'
          else if (isOtherPlayer) label = '👤'
          else if (item) label = '📦'
          else if (npc) label = '👤'
          
          hexes.push(
            <g key={`${q},${r}`} transform={`translate(${screenX}, ${screenY})`}>
              <polygon
                points={`${HEX_SIZE},0 ${HEX_SIZE/2},${HEX_HEIGHT/2} ${-HEX_SIZE/2},${HEX_HEIGHT/2} ${-HEX_SIZE},0 ${-HEX_SIZE/2},${-HEX_HEIGHT/2} ${HEX_SIZE/2},${-HEX_HEIGHT/2}`}
                fill={fillColor}
                stroke="#333"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  if (item) pickupItem(item.worldItemId)
                  if (npc) startConversation(npc.npcId)
                }}
              />
              <text textAnchor="middle" dy="0.3em" fontSize="10">
                {label}
              </text>
              {npc && (
                <text textAnchor="middle" dy="1.5em" fontSize="8" fill="#666">
                  {npc.name.slice(0, 8)}
                </text>
              )}
            </g>
          )
        }
      }
    }
    return hexes
  }

  return (
    <div className="app">
      <header>
        <h1>Cozy MMO</h1>
        <div className="status-bar">
          <span className={`status ${connected ? 'online' : 'offline'}`}>
            {connected ? '● Connected' : '○ Disconnected'}
          </span>
          {player && (
            <span className="player-info">
              Lvl {player.level} | ({player.hexQ}, {player.hexR})
            </span>
          )}
        </div>
      </header>

      <main className="game-layout">
        <div className="game-area">
          <div className="hex-grid">
            <svg width="800" height="600" viewBox="0 0 800 600">
              {renderHexGrid()}
            </svg>
          </div>
          
          <div className="controls">
            <div className="movement-controls">
              <h3>Movement</h3>
              <div className="hex-controls">
                <button onClick={() => movePlayer(0, -1)}>↖</button>
                <button onClick={() => movePlayer(1, -1)}>↗</button>
                <button onClick={() => movePlayer(-1, 0)}>←</button>
                <button onClick={() => movePlayer(1, 0)}>→</button>
                <button onClick={() => movePlayer(-1, 1)}>↙</button>
                <button onClick={() => movePlayer(0, 1)}>↘</button>
              </div>
            </div>

            <div className="action-controls">
              <h3>Actions</h3>
              <button onClick={() => setShowInventory(!showInventory)}>
                {showInventory ? 'Hide' : 'Show'} Inventory
              </button>
            </div>
          </div>
        </div>

        <aside className="sidebar">
          <div className="log-panel">
            <h3>Game Log</h3>
            <div className="logs">
              {logs.map((log, i) => (
                <div key={i} className="log-entry">{log}</div>
              ))}
            </div>
          </div>

          {showInventory && (
            <div className="inventory-panel">
              <h3>Inventory</h3>
              <div className="inventory-grid">
                {inventory.length === 0 ? (
                  <p>Empty</p>
                ) : (
                  inventory.map((item, i) => (
                    <div key={i} className="inventory-slot">
                      Item x{item.quantity}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="nearby-panel">
            <h3>Nearby</h3>
            <div className="nearby-list">
              {allPlayers.filter(p => {
                if (!player) return false
                // Don't show current player
                if (p.identity.toHexString() === player.identity.toHexString()) return false
                const dq = Math.abs(p.hexQ - player.hexQ)
                const dr = Math.abs(p.hexR - player.hexR)
                return dq <= 3 && dr <= 3
              }).map(otherPlayer => (
                <div key={otherPlayer.identity.toHexString()} className="nearby-item">
                  🧑 Player ({otherPlayer.hexQ}, {otherPlayer.hexR})
                </div>
              ))}
              {npcs.filter(n => {
                if (!player) return false
                const dq = Math.abs(n.hexQ - player.hexQ)
                const dr = Math.abs(n.hexR - player.hexR)
                return dq <= 2 && dr <= 2
              }).map(npc => (
                <div key={Number(npc.npcId)} className="nearby-item">
                  👤 {npc.name} ({npc.npcType === 1 ? 'Merchant' : npc.npcType === 2 ? 'Villager' : 'Quest'})
                  <button onClick={() => startConversation(npc.npcId)}>Talk</button>
                </div>
              ))}
              {worldItems.filter(i => {
                if (!player) return false
                const dq = Math.abs(i.hexQ - player.hexQ)
                const dr = Math.abs(i.hexR - player.hexR)
                return dq <= 1 && dr <= 1
              }).map(item => (
                <div key={Number(item.worldItemId)} className="nearby-item">
                  📦 Item #{item.worldItemId.toString()}
                  <button onClick={() => pickupItem(item.worldItemId)}>Pickup</button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
