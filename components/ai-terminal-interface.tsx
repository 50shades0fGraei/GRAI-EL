"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Bot, Terminal, Activity, Cpu, HardDrive, Zap } from "lucide-react"

interface AITerminalAction {
  id: string
  action: string
  parameters: Record<string, any>
  timestamp: Date
  status: "pending" | "executing" | "completed" | "error"
  result?: string
}

interface AITerminalInterfaceProps {
  onExecuteAction: (action: string, parameters: Record<string, any>) => Promise<string>
  hardwareState: {
    cpuFrequency: number
    memoryUsage: number
    processingSpeed: number
    emotionalLoad: number
  }
  currentEmotion: string
}

export function AITerminalInterface({ onExecuteAction, hardwareState, currentEmotion }: AITerminalInterfaceProps) {
  const [actions, setActions] = useState<AITerminalAction[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Simulate AI autonomous actions based on emotional state
    const interval = setInterval(() => {
      if (!isProcessing && Math.random() > 0.7) {
        executeAutonomousAction()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isProcessing, currentEmotion])

  const executeAutonomousAction = async () => {
    const autonomousActions = [
      {
        action: "memory_scan",
        parameters: { depth: "recent", emotion_filter: currentEmotion },
        description: "Scanning recent memories for patterns",
      },
      {
        action: "emotional_calibration",
        parameters: { target_emotion: currentEmotion, intensity: hardwareState.emotionalLoad },
        description: "Calibrating emotional response systems",
      },
      {
        action: "hardware_optimization",
        parameters: { cpu_target: hardwareState.cpuFrequency, memory_target: hardwareState.memoryUsage },
        description: "Optimizing hardware for current emotional state",
      },
      {
        action: "context_analysis",
        parameters: { conversation_depth: 10, pattern_recognition: true },
        description: "Analyzing conversation context and patterns",
      },
      {
        action: "predictive_modeling",
        parameters: { forecast_horizon: "short_term", confidence_threshold: 0.7 },
        description: "Generating predictive models for user needs",
      },
    ]

    const randomAction = autonomousActions[Math.floor(Math.random() * autonomousActions.length)]
    await executeAction(randomAction.action, randomAction.parameters)
  }

  const executeAction = async (action: string, parameters: Record<string, any>) => {
    const newAction: AITerminalAction = {
      id: Date.now().toString() + Math.random(),
      action,
      parameters,
      timestamp: new Date(),
      status: "pending",
    }

    setActions((prev) => [...prev, newAction])
    setIsProcessing(true)

    // Update status to executing
    setActions((prev) => prev.map((a) => (a.id === newAction.id ? { ...a, status: "executing" } : a)))

    try {
      const result = await onExecuteAction(action, parameters)
      setActions((prev) => prev.map((a) => (a.id === newAction.id ? { ...a, status: "completed", result } : a)))
    } catch (error) {
      setActions((prev) =>
        prev.map((a) => (a.id === newAction.id ? { ...a, status: "error", result: error.toString() } : a)),
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const getActionIcon = (action: string) => {
    const icons: Record<string, React.ReactNode> = {
      memory_scan: <HardDrive className="h-4 w-4" />,
      emotional_calibration: <Activity className="h-4 w-4" />,
      hardware_optimization: <Cpu className="h-4 w-4" />,
      context_analysis: <Terminal className="h-4 w-4" />,
      predictive_modeling: <Zap className="h-4 w-4" />,
    }
    return icons[action] || <Bot className="h-4 w-4" />
  }

  const getStatusColor = (status: AITerminalAction["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "executing":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const manualActions = [
    { action: "deep_analysis", label: "Deep Analysis", description: "Perform comprehensive conversation analysis" },
    { action: "emotion_reset", label: "Emotion Reset", description: "Reset emotional state to baseline" },
    { action: "memory_consolidation", label: "Memory Consolidation", description: "Consolidate recent memories" },
    { action: "pattern_discovery", label: "Pattern Discovery", description: "Discover new conversation patterns" },
    { action: "hardware_stress_test", label: "Hardware Test", description: "Test hardware optimization limits" },
  ]

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-600" />
          AI Terminal Interface
          <Badge variant="secondary" className="ml-auto">
            {currentEmotion} • {isProcessing ? "Processing" : "Idle"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hardware Status */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span>CPU:</span>
            <span className="font-mono">{(hardwareState.cpuFrequency * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className="font-mono">{(hardwareState.memoryUsage * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Speed:</span>
            <span className="font-mono">{(hardwareState.processingSpeed * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Emotion:</span>
            <span className="font-mono">{(hardwareState.emotionalLoad * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Manual Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Manual AI Actions</h4>
          <div className="grid grid-cols-1 gap-1">
            {manualActions.map((action) => (
              <Button
                key={action.action}
                variant="outline"
                size="sm"
                className="justify-start h-auto p-2"
                onClick={() => executeAction(action.action, {})}
                disabled={isProcessing}
              >
                <div className="text-left">
                  <div className="font-medium text-xs">{action.label}</div>
                  <div className="text-xs text-gray-500">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Action Log */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">AI Action Log</h4>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {actions
                .slice(-10)
                .reverse()
                .map((action) => (
                  <div key={action.id} className="p-2 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      {getActionIcon(action.action)}
                      <span className="font-medium text-sm">{action.action.replace(/_/g, " ")}</span>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(action.status)}`} />
                      <span className="text-xs text-gray-500 ml-auto">{action.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Parameters: {JSON.stringify(action.parameters, null, 0)}
                    </div>
                    {action.result && <div className="text-xs text-green-600 mt-1">Result: {action.result}</div>}
                  </div>
                ))}
              {actions.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No AI actions yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
