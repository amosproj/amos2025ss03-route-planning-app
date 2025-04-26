// frontend/src/App.tsx
import { useState, useCallback } from 'react'
import { CssVarsProvider } from '@mui/joy/styles'
import CssBaseline from '@mui/joy/CssBaseline'
import Box from '@mui/joy/Box'
import Stack from '@mui/joy/Stack'
import Sheet from '@mui/joy/Sheet'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { VRPNode, Route, ScenarioData } from './types'
import ControlPanel from './components/ControlPanel'
import NodeConfigPanel from './components/NodeConfigPanel'
import Canvas from './components/Canvas'
import StatusBar from './components/StatusBar'
import RouteSummaryPanel from './components/RouteSummaryPanel'
import exampleScenario from './assets/basic example.json'
import ActionButtons from './components/ActionButtons'

const queryClient = new QueryClient()

function App() {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialScenario: ScenarioData = {
    nodes: exampleScenario.nodes as VRPNode[],
    num_vehicles: exampleScenario.num_vehicles,
    available_skills: exampleScenario.available_skills,
    vehicle_skills: Object.fromEntries(
      Object.entries(exampleScenario.vehicle_skills).map(([k, v]) => [String(k), v as string[]])
    )
  }

  const [nodes, setNodes] = useState<VRPNode[]>(initialScenario.nodes)
  const [numVehicles, setNumVehicles] = useState<number>(initialScenario.num_vehicles)
  const [availableSkills, setAvailableSkills] = useState<string[]>(initialScenario.available_skills)
  const [vehicleSkills, setVehicleSkills] = useState<{ [key: string]: string[] }>(initialScenario.vehicle_skills)
  const [selectedNode, setSelectedNode] = useState<VRPNode | null>(initialScenario.nodes[0] || null)
  const [routes, setRoutes] = useState<Route[]>([])
  const [statusMessage, setStatusMessage] = useState<string>('Ready')
  const [maxDistance, setMaxDistance] = useState<number | undefined>(undefined)
  const [totalDistance, setTotalDistance] = useState<number | undefined>(undefined)
  const [showRouteSummary, setShowRouteSummary] = useState<boolean>(false)

  // --- Callbacks for ControlPanel ---
  const handleAddNode = useCallback((newNode: VRPNode) => {
    setNodes((prevNodes) => [...prevNodes, newNode])
    setStatusMessage(`Added Node ${newNode.id}`)
  }, [])

  const handleRemoveNode = useCallback(
    (nodeIdToRemove: number) => {
      setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeIdToRemove))
      if (selectedNode?.id === nodeIdToRemove) {
        setSelectedNode(null)
      }
      setStatusMessage(`Removed Node ${nodeIdToRemove}`)
      setRoutes([])
      setShowRouteSummary(false)
    },
    [selectedNode]
  )

  const handleSelectNode = useCallback((node: VRPNode | null) => {
    setSelectedNode(node)
    setStatusMessage(node ? `Selected Node ${node.id}` : 'Node deselected')
  }, [])

  const handleUpdateNode = useCallback((updatedNode: VRPNode) => {
    setNodes((prevNodes) => prevNodes.map((node) => (node.id === updatedNode.id ? updatedNode : node)))
    setSelectedNode(updatedNode)
    setStatusMessage(`Updated Node ${updatedNode.id}`)
    setRoutes([])
    setShowRouteSummary(false)
  }, [])

  const handleNumVehiclesChange = useCallback((count: number) => {
    setNumVehicles(count)
    setVehicleSkills((prevSkills) => {
      const newSkills: { [key: string]: string[] } = {}
      for (let i = 0; i < count; i++) {
        newSkills[String(i)] = prevSkills[String(i)] || []
      }
      return newSkills
    })
    setStatusMessage(`Number of vehicles set to ${count}`)
    setRoutes([])
    setShowRouteSummary(false)
  }, [])

  const handleSkillsChange = useCallback(
    (newAvailableSkills: string[], newVehicleSkills: { [key: string]: string[] }) => {
      setAvailableSkills(newAvailableSkills)
      setVehicleSkills(newVehicleSkills)
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          required_skills: node.required_skills?.filter((skill) => newAvailableSkills.includes(skill))
        }))
      )
      setStatusMessage(`Skills updated`)
      setRoutes([])
      setShowRouteSummary(false)
    },
    []
  )

  const handleClearRoutes = useCallback(() => {
    setRoutes([])
    setStatusMessage('Routes cleared.')
    setShowRouteSummary(false)
    setMaxDistance(undefined)
    setTotalDistance(undefined)
  }, [])

  const handleClearAll = useCallback(() => {
    const depot = nodes.find((n) => n.is_depot)
    setNodes(depot ? [depot] : [])
    setSelectedNode(null)
    setRoutes([])
    setStatusMessage('Scenario cleared.')
    setShowRouteSummary(false)
    setMaxDistance(undefined)
    setTotalDistance(undefined)
    // Reset other settings if desired
    // setNumVehicles(initialScenario.num_vehicles);
    // setAvailableSkills(initialScenario.available_skills);
    // setVehicleSkills(initialScenario.vehicle_skills);
  }, [nodes])

  const handleLoadExample = useCallback(() => {
    // Reload the initial example data
    setNodes(initialScenario.nodes)
    setNumVehicles(initialScenario.num_vehicles)
    setAvailableSkills(initialScenario.available_skills)
    setVehicleSkills(initialScenario.vehicle_skills)
    setSelectedNode(null)
    setRoutes([])
    setStatusMessage('Loaded example scenario.')
    setShowRouteSummary(false)
    setMaxDistance(undefined)
    setTotalDistance(undefined)
  }, [initialScenario])


  // --- Current Scenario Data for Solver ---
  const getCurrentScenarioData = (): ScenarioData => ({
    nodes,
    num_vehicles: numVehicles,
    available_skills: availableSkills,
    vehicle_skills: vehicleSkills
  })

  return (
    <CssVarsProvider>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <Box sx={{ display: 'flex', height: '100vh', p: 1, gap: 1 }}>
          {/* Control Panel Area */}
          <ControlPanel
            numVehicles={numVehicles}
            onNumVehiclesChange={handleNumVehiclesChange}
            availableSkills={availableSkills}
            vehicleSkills={vehicleSkills}
            onSkillsChange={handleSkillsChange}
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNode}
            onSolve={() => { }}
            onClearRoutes={handleClearRoutes}
            onClearAll={handleClearAll}
            onLoadExample={handleLoadExample}
            getCurrentScenarioData={getCurrentScenarioData}
            setStatusMessage={setStatusMessage}
            setRoutes={setRoutes}
          />

          {selectedNode && !showRouteSummary && (
            <NodeConfigPanel
              node={selectedNode}
              availableSkills={availableSkills}
              updateNode={handleUpdateNode}
              onClose={() => setSelectedNode(null)}
            />
          )}

          {routes.length > 0 && (
            <RouteSummaryPanel
              routes={routes}
              nodes={nodes}
              vehicleSkills={vehicleSkills}
              maxDistance={maxDistance}
              totalDistance={totalDistance}
              onClose={() => setShowRouteSummary(false)}
            />
          )}

          {/* Canvas and Status Area */}
          <Stack sx={{ flexGrow: 1, gap: 1 }}>
            <Sheet
              variant='outlined'
              sx={{
                flexGrow: 1,
                p: 1,
                borderRadius: 'sm',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
              }}
            >
              <ActionButtons
                onClearNodes={handleClearAll}
                onSave={function (): void {
                  throw new Error('Function not implemented.')
                }}
                onLoad={handleLoadExample}
                onClearRoutes={handleClearRoutes}
                setStatusMessage={setStatusMessage}
                setRoutes={(routes, maxDist, totalDist) => {
                  setRoutes(routes)
                  setMaxDistance(maxDist)
                  setTotalDistance(totalDist)
                  setShowRouteSummary(routes.length > 0)
                }}
                getCurrentScenarioData={getCurrentScenarioData}
              />
              {/* --- Canvas Component --- */}
              <Canvas
                nodes={nodes}
                routes={routes}
                selectedNodeId={selectedNode?.id ?? null}
                onAddNode={handleAddNode}
                onRemoveNode={handleRemoveNode}
                onSelectNode={handleSelectNode}
                width={800}
                height={600}
              />
            </Sheet>
            {/* --- Status Bar --- */}
            <StatusBar message={statusMessage} />
          </Stack>
        </Box>
      </QueryClientProvider>
    </CssVarsProvider>
  )
}

export default App
