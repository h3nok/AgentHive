import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { addMessage } from '../../features/chat/chatSlice';
import { stepAdded, stepUpdated } from '../../features/processing/processingSlice';
import type { ChatMessage } from '../../features/chat/chatSlice';
import { UKG_DEMO_FLOWS, type UKGDemoFlow, type DemoState } from './types';

export const useUKGDemo = () => {
  const dispatch = useDispatch();
  const activeSessionId = useSelector((s: RootState) => s.chat.activeSessionId);
  const [demoState, setDemoState] = useState<DemoState>({
    activeFlow: null,
    currentStep: 0,
    isProcessing: false,
    formData: {},
    showTypingIndicator: false
  });

  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Clear all timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutRefs.current;
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Check if a message should trigger a demo flow
  const checkForDemoTrigger = useCallback((message: string): UKGDemoFlow | null => {
    const lowerMessage = message.toLowerCase().trim();
    
    for (const flow of UKG_DEMO_FLOWS) {
      for (const trigger of flow.trigger) {
        if (lowerMessage.includes(trigger.toLowerCase())) {
          return flow;
        }
      }
    }
    
    return null;
  }, []);

  // Add a system message with typing delay
  const addSystemMessage = useCallback((text: string, delay: number = 0): Promise<void> => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        const systemMessage: ChatMessage = {
          id: `system-${Date.now()}-${Math.random()}`,
          text,
          sender: 'system',
          timestamp: new Date().toISOString(),
        };
        dispatch(addMessage(systemMessage));
        resolve();
      }, delay);
      
      timeoutRefs.current.push(timeout);
    });
  }, [dispatch]);

  // Add HR Agent message with typing indicator
  const addHRAgentMessage = useCallback((flow: UKGDemoFlow, delay: number = 0): Promise<void> => {
    return new Promise((resolve) => {
      // First show typing indicator immediately
      setDemoState(prev => ({ ...prev, showTypingIndicator: true }));
      
      // Wait for the delay, then hide indicator and add message
      const timeout = setTimeout(() => {
        // Hide typing indicator and add message
        setDemoState(prev => ({ ...prev, showTypingIndicator: false }));
        
        const hrMessage: ChatMessage = {
          id: `hr-agent-${Date.now()}`,
          text: flow.hrAgentResponse.content,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          agent: 'hr'
        };
        dispatch(addMessage(hrMessage));
        resolve();
      }, delay);
      
      timeoutRefs.current.push(timeout);
    });
  }, [dispatch]);

  // Process the demo flow
  const processDemoFlow = useCallback(async (flow: UKGDemoFlow) => {
    setDemoState(prev => ({ 
      ...prev, 
      activeFlow: flow, 
      currentStep: 0, 
      isProcessing: true,
      formData: {}
    }));

    try {
      // Add initial processing steps to timeline (visual indicator)
      const timelineLabels = flow.systemMessages;
      timelineLabels.forEach((label, idx) => {
        if (!activeSessionId) return;
        dispatch(stepAdded({
          sessionId: activeSessionId,
          step: {
            id: `demo-${flow.id}-${idx}`,
            label,
            state: 'pending',
            startedAt: Date.now()
          }
        }));
      });

      // Step 1: Add system messages in sequence with delays
      for (let i = 0; i < flow.systemMessages.length; i++) {
        await addSystemMessage(flow.systemMessages[i], i === 0 ? 800 : 1200);
        // Mark step as completed
        if (activeSessionId) {
          dispatch(stepUpdated({
            sessionId: activeSessionId,
            id: `demo-${flow.id}-${i}`,
            state: 'ok'
          }));
        }
      }

      // Step 2: Show HR Agent typing and response
      await addHRAgentMessage(flow, 1500);

      // Optional: mark HR agent connection step
      if (activeSessionId) {
        dispatch(stepAdded({
          sessionId: activeSessionId,
          step: {
            id: `demo-${flow.id}-hr-connect`,
            label: 'HR agent connected',
            state: 'ok',
            startedAt: Date.now(),
            finishedAt: Date.now()
          }
        }));
      }

      // If it's a clock in/out flow, add enhanced UKG details
      if (flow.id === 'clock-in-out') {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString();
        const isClockIn = flow.trigger.some(t => ['clock in', 'punch in', 'check in', 'start work'].includes(t));
        
        const detailsMessage: ChatMessage = {
          id: `hr-details-${Date.now()}`,
          text: `✅ **${isClockIn ? 'Clock In' : 'Clock Out'} Successful!**\n\n🕐 **Time:** ${timeString} on ${dateString}\n📍 **Location:** Tractor Supply Store #1247\n🏢 **Department:** Customer Service\n📱 **Device:** UKG Mobile App\n🆔 **Employee ID:** TSC-${Math.floor(Math.random() * 10000)}\n\n📊 **Today's Hours:** ${isClockIn ? '0:00' : '8:15'} (${isClockIn ? 'Started' : 'Completed'})\n💰 **Pay Period:** Week 2 of 2`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          agent: 'hr'
        };
        
        await new Promise<void>(resolve => {
          const timeout = setTimeout(() => {
            dispatch(addMessage(detailsMessage));
            resolve();
          }, 1000);
          timeoutRefs.current.push(timeout);
        });

        // Add schedule info for clock-in
        if (isClockIn) {
          const scheduleMessage: ChatMessage = {
            id: `schedule-${Date.now()}`,
            text: `📅 **Today's Schedule from UKG:**\n\n• **Shift:** 9:00 AM - 5:30 PM\n• **Break:** 12:00 PM - 12:30 PM (Lunch)\n• **Break:** 3:00 PM - 3:15 PM\n• **Expected Hours:** 8.0\n\n⏰ **Reminder:** Don't forget to clock out for breaks!`,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            agent: 'hr'
          };
          
          await new Promise<void>(resolve => {
            const timeout = setTimeout(() => {
              dispatch(addMessage(scheduleMessage));
              resolve();
            }, 2000);
            timeoutRefs.current.push(timeout);
          });
        }
      }

      // Handle other flow types
      if (flow.id === 'schedule-check') {
        const scheduleMessage: ChatMessage = {
          id: `schedule-check-${Date.now()}`,
          text: `📅 **Your UKG Work Schedule:**\n\n**This Week:**\n• **Today (Wed):** 9:00 AM - 5:30 PM\n• **Thursday:** 9:00 AM - 5:30 PM\n• **Friday:** 9:00 AM - 5:30 PM\n• **Saturday:** 8:00 AM - 4:00 PM\n• **Sunday:** OFF\n\n**Next Week:**\n• **Monday:** 9:00 AM - 5:30 PM\n• **Tuesday:** 9:00 AM - 5:30 PM\n\n⏰ **Total Hours This Week:** 32.0\n📍 **All shifts at Store #1247**`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          agent: 'hr'
        };
        
        await new Promise<void>(resolve => {
          const timeout = setTimeout(() => {
            dispatch(addMessage(scheduleMessage));
            resolve();
          }, 1000);
          timeoutRefs.current.push(timeout);
        });
      }

      if (flow.id === 'benefits-inquiry') {
        const benefitsMessage: ChatMessage = {
          id: `benefits-${Date.now()}`,
          text: `💼 **Your UKG Benefits Summary:**\n\n**Time Off Balances:**\n• **Vacation:** 15.5 days available\n• **Sick Leave:** 8.0 days available\n• **Personal Days:** 3.0 days available\n\n**Health & Insurance:**\n• **Medical:** Anthem Blue Cross (Active)\n• **Dental:** Delta Dental (Active)\n• **Vision:** VSP (Active)\n\n**Retirement:**\n• **401(k):** 6% contribution (Company match: 3%)\n• **Current Balance:** $12,450.67\n\n📞 **Need help?** Contact HR at (615) 440-4000`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          agent: 'hr'
        };
        
        await new Promise<void>(resolve => {
          const timeout = setTimeout(() => {
            dispatch(addMessage(benefitsMessage));
            resolve();
          }, 1000);
          timeoutRefs.current.push(timeout);
        });
      }

    } catch (error) {
      console.error('Error processing demo flow:', error);
    } finally {
      setDemoState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [addSystemMessage, addHRAgentMessage, dispatch, activeSessionId]);

  // Handle form submission for time-off requests
  const handleFormSubmit = useCallback(async (formData: Record<string, string>) => {
    const flow = demoState.activeFlow;
    if (!flow || !flow.finalMessages) return;

    setDemoState(prev => ({ ...prev, formData, isProcessing: true, showTypingIndicator: true }));

    try {
      if (activeSessionId) {
        dispatch(stepAdded({
          sessionId: activeSessionId,
          step: {
            id: 'timeoff-submit',
            label: 'Submitting time-off request',
            state: 'pending',
            startedAt: Date.now()
          }
        }));
      }

      // Add final system messages
      for (let i = 0; i < flow.finalMessages.length; i++) {
        await addSystemMessage(flow.finalMessages[i], i === 0 ? 500 : 1000);
      }

      // Add initial confirmation
      const confirmation: ChatMessage = {
        id: `hr-confirm-${Date.now()}`,
        text: `**Step 1 – Check balance**\nPersonal days available: **5**\n\n**Step 2 – Submit request**\nDates: **${formData.startDate} ➜ ${formData.endDate}**\nType: **${formData.timeOffType}**\n\n**Step 3 – Await approval**\n✅ Request sent to manager and UKG. You'll receive email updates.`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        agent: 'hr'
      };

      await new Promise<void>(resolve => {
        const timeout = setTimeout(() => {
          dispatch(addMessage(confirmation));
          setDemoState(prev => ({ ...prev, showTypingIndicator: false }));
          if (activeSessionId) {
            dispatch(stepUpdated({ sessionId: activeSessionId, id: 'timeoff-submit', state: 'ok' }));
          }
          resolve();
        }, 1500);
        timeoutRefs.current.push(timeout);
      });

      // Manager approval flow
      if (flow.managerApprovalFlow?.enabled && flow.managerApprovalFlow.messages) {
        for (let i = 0; i < flow.managerApprovalFlow.messages.length; i++) {
          await new Promise<void>(resolve => {
            const timeout = setTimeout(() => {
              const approvalMessage: ChatMessage = {
                id: `approval-${Date.now()}-${i}`,
                text: flow.managerApprovalFlow!.messages[i],
                sender: 'system',
                timestamp: new Date().toISOString(),
              };
              dispatch(addMessage(approvalMessage));
              resolve();
            }, flow.managerApprovalFlow!.delayMs + (i * 1500));
            timeoutRefs.current.push(timeout);
          });
        }

        // Add final approval confirmation
        await new Promise<void>(resolve => {
          const timeout = setTimeout(() => {
            const finalApprovalMessage: ChatMessage = {
              id: `final-approval-${Date.now()}`,
              text: `🎉 **Manager Approved**\n\nYour personal days ( ${formData.startDate} ➜ ${formData.endDate} ) are now scheduled in UKG.\n\n**Updated balance:** 2 personal days remaining.`,
              sender: 'assistant',
              timestamp: new Date().toISOString(),
              agent: 'hr'
            };
            dispatch(addMessage(finalApprovalMessage));
            resolve();
          }, flow.managerApprovalFlow!.delayMs + (flow.managerApprovalFlow!.messages.length * 1500));
          timeoutRefs.current.push(timeout);
        });
      }

      // Notification flow
      if (flow.notificationFlow?.enabled && flow.notificationFlow.messages) {
        for (let i = 0; i < flow.notificationFlow.messages.length; i++) {
          await new Promise<void>(resolve => {
            const timeout = setTimeout(() => {
              const notificationMessage: ChatMessage = {
                id: `notification-${Date.now()}-${i}`,
                text: flow.notificationFlow!.messages[i],
                sender: 'system',
                timestamp: new Date().toISOString(),
              };
              dispatch(addMessage(notificationMessage));
              resolve();
            }, flow.notificationFlow!.delayMs + (i * 1000));
            timeoutRefs.current.push(timeout);
          });
        }
      }

    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      // Reset state after all flows complete
      const totalDelay = Math.max(
        flow.managerApprovalFlow?.delayMs || 0,
        flow.notificationFlow?.delayMs || 0
      ) + 5000;
      
      const timeout = setTimeout(() => {
        setDemoState(prev => ({ 
          ...prev, 
          isProcessing: false, 
          activeFlow: null, 
          currentStep: 0,
          formData: {}
        }));
      }, totalDelay);
      timeoutRefs.current.push(timeout);
    }
  }, [demoState.activeFlow, addSystemMessage, dispatch, activeSessionId]);

  // Intercept messages to check for demo triggers
  const triggerDemo = useCallback((message: string) => {
    console.log('UKG Demo: Checking message for triggers:', message);
    const flow = checkForDemoTrigger(message);
    console.log('UKG Demo: Found flow:', flow?.id || 'none');
    if (flow && !demoState.isProcessing) {
      console.log('UKG Demo: Triggering flow:', flow.id);
      
      // Quick natural-language shortcut for time-off if message already
      // contains start date, end date and leave type.
      if (flow.id === 'time-off-request') {
        const dateRe = /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](\d{2,4})\b/g;
        const typeRe = /(personal|vacation|sick|pto|bereavement)/i;
        const dates = message.match(dateRe) || [];
        const typeMatch = message.match(typeRe);
        if (dates.length >= 2 && typeMatch) {
          const [startDate, endDate] = dates;
          const timeOffType = typeMatch[0];

          // 1. Emit the standard system steps as chips + system messages
          const simulateSteps = async () => {
            const sysMsgs = flow.systemMessages;
            for (let i = 0; i < sysMsgs.length; i++) {
              const label = sysMsgs[i].replace(/^[^ ]+ /, '').replace('...', '');
              if (activeSessionId) {
                dispatch(stepAdded({
                  sessionId: activeSessionId,
                  step: {
                    id: `nl-${i}`,
                    label,
                    state: 'pending',
                    startedAt: Date.now()
                  }
                }));
              }
              await addSystemMessage(sysMsgs[i], i === 0 ? 400 : 800);
              if (activeSessionId) {
                dispatch(stepUpdated({ sessionId: activeSessionId, id: `nl-${i}`, state: 'ok' }));
              }
            }

            // 2. Confirmation bubble
            const confirmation: ChatMessage = {
              id: `hr-confirm-${Date.now()}`,
              text: `**Step 1 – Balance OK**\nPersonal days available: **5**\n\n**Step 2 – Request logged**\n${startDate} ➜ ${endDate}  (**${timeOffType}**)\n\n🎉 **Awaiting manager approval**`,
              sender: 'assistant',
              timestamp: new Date().toISOString(),
              agent: 'hr'
            };
            dispatch(addMessage(confirmation));
          };

          simulateSteps();
          return true;
        }
      }

      // The user message is already in the store (added by the input component).
      // Simply start processing the demo flow.
      processDemoFlow(flow);
      return true; // Indicates demo was triggered
    }
    console.log('UKG Demo: No trigger, continuing normal flow');
    return false; // Indicates normal message flow should continue
  }, [checkForDemoTrigger, demoState.isProcessing, processDemoFlow, dispatch, activeSessionId]);

  return {
    triggerDemo,
    handleFormSubmit,
    demoState
  };
};
