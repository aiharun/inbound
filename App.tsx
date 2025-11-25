
import React, { useState, useMemo, useEffect } from 'react';
import { Ramp, Vehicle, VehicleStatus, WarehouseStats, User, ActiveSession, AdminMessage, ChatMessage, SystemLog, DailyArchive, ChatSettings } from './types';
import { RampCard } from './components/RampCard';
import { VehicleList } from './components/VehicleList';
import { PlannedTripsList } from './components/PlannedTripsList';
import { AddVehicleModal } from './components/AddVehicleModal';
import { AddTripModal } from './components/AddTripModal';
import { AssignRampModal } from './components/AssignRampModal';
import { DriverListModal } from './components/DriverListModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { StatsOverview } from './components/StatsOverview';
import { AddNoteModal } from './components/AddNoteModal';
import { ConfirmModal } from './components/ConfirmModal';
import { PlannedTripsEditorModal } from './components/PlannedTripsEditorModal';
import { EditQuantityModal } from './components/EditQuantityModal';
import { AdminMessageModal } from './components/AdminMessageModal';
import { ChatModal } from './components/ChatModal';
import { AdminLogsModal } from './components/AdminLogsModal';
import { CompleteRampModal } from './components/CompleteRampModal';
import { ArchiveListModal } from './components/ArchiveListModal';
import { LayoutDashboard, Repeat, Phone, LogIn, LogOut, StickyNote, RotateCcw, CheckCircle2, Cloud, CloudOff, Users, MessageSquare, FileClock, Archive, Eye } from 'lucide-react';
import { DRIVER_REGISTRY, DriverInfo } from './data/drivers';
import { INITIAL_USERS } from './data/users';
import { subscribeToData, updateData, resetCloudData, isFirebaseConfigured, subscribeToChat, sendChatMessage, addSystemLog, saveDailyArchive, getArchiveById, clearAllChatMessages, subscribeToChatSettings, saveChatSettings, checkPeriodicChatCleanup } from './services/firebase';

// Initial State Generator
const createInitialRamps = (): Ramp[] => Array.from({ length: 5 }, (_, i) => ({
  id: i.toString(),
  name: `Ramp 0${i + 1}`,
  status: 'FREE',
  currentVehicleId: null,
}));

// Empty initial vehicles
const INITIAL_VEHICLES: Vehicle[] = [];

const App: React.FC = () => {
  // Helper for local storage initialization (used as fallback or cache)
  const getStoredState = <T,>(key: string, initialValue: T): T => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // State definitions
  const [ramps, setRamps] = useState<Ramp[]>(() => getStoredState('dockflow_ramps', createInitialRamps()));
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getStoredState('dockflow_vehicles', INITIAL_VEHICLES));
  const [availablePlates, setAvailablePlates] = useState<string[]>(() => getStoredState('dockflow_plates', Object.keys(DRIVER_REGISTRY)));
  const [drivers, setDrivers] = useState<Record<string, DriverInfo>>(() => getStoredState('dockflow_drivers', DRIVER_REGISTRY));
  const [scheduledTrips, setScheduledTrips] = useState<Record<string, number>>(() => getStoredState('dockflow_trips', {}));
  const [canceledTrips, setCanceledTrips] = useState<Record<string, number>>(() => getStoredState('dockflow_canceled', {}));
  const [vehicleNotes, setVehicleNotes] = useState<Record<string, string>>(() => getStoredState('dockflow_notes', {}));
  
  // User Management State
  const [users, setUsers] = useState<User[]>(() => getStoredState('dockflow_users_list', INITIAL_USERS));
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(() => getStoredState('dockflow_sessions', []));
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredState('dockflow_user', null));
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => getStoredState('dockflow_session_id', null));
  
  const isLoggedIn = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);
  const [lastReadChatTime, setLastReadChatTime] = useState<string>(() => 
    getStoredState('dockflow_chat_last_read', new Date().toISOString())
  );
  
  // Sync State
  const [isSynced, setIsSynced] = useState(false);

  // Archive Mode State
  const [isArchiveMode, setIsArchiveMode] = useState(false);
  const [archiveDate, setArchiveDate] = useState<string | null>(null);

  // Modals State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isPlannedTripsEditorOpen, setIsPlannedTripsEditorOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isArchiveListOpen, setIsArchiveListOpen] = useState(false);
  const [assigningVehicleId, setAssigningVehicleId] = useState<string | null>(null);
  const [isEndDayConfirmOpen, setIsEndDayConfirmOpen] = useState(false);
  
  // Quantity Edit State
  const [isEditQuantityModalOpen, setIsEditQuantityModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [hideSackFieldsInEdit, setHideSackFieldsInEdit] = useState(false);
  const [editingValues, setEditingValues] = useState({
      count: 0,
      incomingSacks: 0,
      outgoingSacks: 0
  });
  
  // Ramp Completion State
  const [completingRampId, setCompletingRampId] = useState<string | null>(null);

  // Confirmation State for Actions
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    action: 'CLEAR_RAMP' | 'CANCEL_WAITING' | 'CANCEL_PLANNED' | 'REVERT_RAMP' | null;
    targetId: string | null;
    title: string;
    message: string;
    isDanger: boolean;
  }>({
    isOpen: false,
    action: null,
    targetId: null,
    title: '',
    message: '',
    isDanger: false
  });

  // State to hold the plate selected from the Planned Trips list
  const [targetPlate, setTargetPlate] = useState<string>('');
  const [targetProductCount, setTargetProductCount] = useState<number | null>(null);

  // LOGGING HELPER
  const handleLogAction = (actionType: SystemLog['actionType'], description: string) => {
    if (!currentUser || isArchiveMode) return; // Only log if user is logged in and NOT in archive mode

    const newLog: SystemLog = {
      id: Date.now().toString(),
      actionType,
      description,
      performedBy: currentUser.username,
      performedByName: currentUser.name,
      timestamp: new Date().toISOString()
    };

    // 1. Add to local state (optional, as subscription will pick it up)
    setSystemLogs(prev => [newLog, ...prev]);

    // 2. Push to Firestore
    if (isFirebaseConfigured()) {
       addSystemLog(newLog);
    }
  };

  // CHECK FOR ARCHIVE MODE ON MOUNT
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const archiveId = params.get('archiveId');
    
    if (archiveId) {
        setIsArchiveMode(true);
        // Fetch archive data
        getArchiveById(archiveId).then((data: any) => {
            if (data) {
                setVehicles(data.vehicles || []);
                setScheduledTrips(data.scheduledTrips || {});
                setCanceledTrips(data.canceledTrips || {});
                setVehicleNotes(data.vehicleNotes || {});
                setArchiveDate(data.date);
                setRamps(createInitialRamps()); 
            } else {
                alert("Kayıt bulunamadı.");
            }
        });
    }
  }, []);

  // REAL-TIME SYNC SETUP
  useEffect(() => {
    if (!isFirebaseConfigured() || isArchiveMode) {
        setIsSynced(false);
        return;
    }

    const unsubscribe = subscribeToData((data) => {
        if (data) {
            // Remote data exists, sync local state
            if (data.ramps) setRamps(data.ramps);
            if (data.vehicles) setVehicles(data.vehicles);
            if (data.availablePlates) setAvailablePlates(data.availablePlates);
            if (data.drivers) setDrivers(data.drivers);
            if (data.scheduledTrips) setScheduledTrips(data.scheduledTrips);
            if (data.canceledTrips) setCanceledTrips(data.canceledTrips);
            if (data.vehicleNotes) setVehicleNotes(data.vehicleNotes);
            if (data.users) setUsers(data.users);
            if (data.activeSessions) setActiveSessions(data.activeSessions);
            if (data.messages) setAdminMessages(data.messages);
            if (data.systemLogs) setSystemLogs(data.systemLogs);
            setIsSynced(true);
        } else {
            // Remote data is empty (new project), seed it with current local/initial state
            resetCloudData({
                ramps,
                vehicles,
                availablePlates,
                drivers,
                scheduledTrips,
                canceledTrips,
                vehicleNotes,
                users,
                activeSessions
            });
            setIsSynced(true);
        }
    });

    return () => unsubscribe();
  }, [isArchiveMode]);

  // CHAT & SETTINGS SUBSCRIPTION
  useEffect(() => {
      if (isLoggedIn && isFirebaseConfigured() && !isArchiveMode) {
          const unsubscribeChat = subscribeToChat((msgs) => {
              setChatMessages(msgs);
          });
          const unsubscribeSettings = subscribeToChatSettings((settings) => {
              setChatSettings(settings);
          });
          
          return () => {
              unsubscribeChat();
              unsubscribeSettings();
          }
      }
  }, [isLoggedIn, isArchiveMode]);

  // AUTO-CLEANUP LOGIC (ADMIN ONLY)
  useEffect(() => {
      if (!isLoggedIn || !isAdmin || !chatSettings) return;

      const checkCleanup = async () => {
          // Pass current settings to check periodic interval
          await checkPeriodicChatCleanup(chatSettings);
      };

      // Check every 5 seconds to ensure timely deletion
      const intervalId = setInterval(checkCleanup, 5000);
      
      // Run immediately on mount/settings change
      checkCleanup();

      return () => clearInterval(intervalId);
  }, [isLoggedIn, isAdmin, chatSettings]);

  // UNREAD CHAT COUNT LOGIC
  const unreadChatCount = useMemo(() => {
    if (isChatOpen || !chatMessages.length) return 0;
    
    // Count messages that are newer than lastReadChatTime and NOT sent by current user
    return chatMessages.filter(m => 
        m.senderUsername !== currentUser?.username && 
        new Date(m.timestamp).getTime() > new Date(lastReadChatTime).getTime()
    ).length;
  }, [chatMessages, lastReadChatTime, isChatOpen, currentUser]);

  // Update Last Read Time when Chat Opens or New Message arrives while open
  useEffect(() => {
    if (isChatOpen && chatMessages.length > 0) {
        // Find the most recent timestamp
        const latestTimestamp = chatMessages[chatMessages.length - 1].timestamp;
        
        // Only update if it's newer than what we have
        if (new Date(latestTimestamp).getTime() > new Date(lastReadChatTime).getTime()) {
            setLastReadChatTime(latestTimestamp);
            window.localStorage.setItem('dockflow_chat_last_read', JSON.stringify(latestTimestamp));
        }
    }
  }, [isChatOpen, chatMessages, lastReadChatTime]);


  // Local Persistence Fallback (Always update local storage as backup)
  // Disable writing to local storage if in Archive Mode to prevent overwriting current day data
  useEffect(() => { if(!isArchiveMode) window.localStorage.setItem('dockflow_ramps', JSON.stringify(ramps)); }, [ramps, isArchiveMode]);
  useEffect(() => { if(!isArchiveMode) window.localStorage.setItem('dockflow_vehicles', JSON.stringify(vehicles)); }, [vehicles, isArchiveMode]);
  useEffect(() => { if(!isArchiveMode) window.localStorage.setItem('dockflow_plates', JSON.stringify(availablePlates)); }, [availablePlates, isArchiveMode]);
  useEffect(() => { if(!isArchiveMode) window.localStorage.setItem('dockflow_drivers', JSON.stringify(drivers)); }, [drivers, isArchiveMode]);
  useEffect(() => { if(!isArchiveMode) window.localStorage.setItem('dockflow_trips', JSON.stringify(scheduledTrips)); }, [scheduledTrips, isArchiveMode]);
  useEffect(() => { if(!isArchiveMode) window.localStorage.setItem('dockflow_canceled', JSON.stringify(canceledTrips)); }, [canceledTrips, isArchiveMode]);
  useEffect(() => { if(!isArchiveMode) window.localStorage.setItem('dockflow_notes', JSON.stringify(vehicleNotes)); }, [vehicleNotes, isArchiveMode]);
  useEffect(() => { if(!isArchiveMode) window.localStorage.setItem('dockflow_users_list', JSON.stringify(users)); }, [users, isArchiveMode]);
  useEffect(() => { if(!isArchiveMode) window.localStorage.setItem('dockflow_sessions', JSON.stringify(activeSessions)); }, [activeSessions, isArchiveMode]);
  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem('dockflow_user', JSON.stringify(currentUser));
    } else {
      window.localStorage.removeItem('dockflow_user');
    }
  }, [currentUser]);
  useEffect(() => {
    if (currentSessionId) {
      window.localStorage.setItem('dockflow_session_id', JSON.stringify(currentSessionId));
    } else {
      window.localStorage.removeItem('dockflow_session_id');
    }
  }, [currentSessionId]);

  // SECURITY ENFORCEMENT: Account Deletion & Single Session
  useEffect(() => {
    if (currentUser && currentSessionId && !isArchiveMode) {
        // 1. Check if the user account still exists in the system
        const accountExists = users.some(u => u.username === currentUser.username);
        
        if (!accountExists) {
            alert("Hesabınız yönetici tarafından silindiği için oturumunuz sonlandırıldı.");
            handleLogout();
            return;
        }

        // 2. Check for Single Session (IDs match)
        if (activeSessions.length > 0) {
            // Find the active session for the current user in the cloud data
            const remoteSession = activeSessions.find(s => s.username === currentUser.username);
            
            // If a session exists in the cloud for this user
            if (remoteSession) {
                // Check if the cloud Session ID matches our local Session ID
                if (remoteSession.sessionId !== currentSessionId) {
                    // IDs don't match, meaning a newer login occurred elsewhere.
                    alert("Hesabınıza başka bir cihazdan giriş yapıldığı için oturumunuz sonlandırıldı.");
                    handleLogout();
                }
            }
        }
    }
  }, [users, activeSessions, currentUser, currentSessionId, isArchiveMode]);

  // Helper to push updates to cloud
  const pushUpdate = (updates: any) => {
    if (isFirebaseConfigured() && !isArchiveMode) {
        updateData(updates);
    }
  };

  // Calculate remaining trips for ALL plates
  const allRemainingTrips = useMemo(() => {
    const processedPlatesSet = new Set(
        vehicles
            .filter(v => v.status !== VehicleStatus.WAITING && v.status !== VehicleStatus.INCOMING)
            .map(v => v.licensePlate)
    );

    const trips: Record<string, number> = {};

    availablePlates.forEach(plate => {
        if (canceledTrips[plate] !== undefined) {
            trips[plate] = 0;
            return;
        }

        if (Object.prototype.hasOwnProperty.call(scheduledTrips, plate)) {
            trips[plate] = scheduledTrips[plate];
        } else {
            trips[plate] = processedPlatesSet.has(plate) ? 0 : 1;
        }
    });
    
    return trips;
  }, [availablePlates, scheduledTrips, vehicles, canceledTrips]);

  // Identify active plates
  const activePlates = useMemo(() => {
    return new Set(vehicles.filter(v => v.status !== VehicleStatus.COMPLETED && v.status !== VehicleStatus.CANCELED).map(v => v.licensePlate));
  }, [vehicles]);

  const logVehicles = useMemo(() => {
    return vehicles.filter(v => v.status !== VehicleStatus.INCOMING);
  }, [vehicles]);

  const stats: WarehouseStats = useMemo(() => {
    const completed = vehicles.filter(v => v.status === VehicleStatus.COMPLETED);
    const totalProducts = vehicles.reduce((acc, v) => acc + v.productCount, 0);
    
    // Calculate total incoming and outgoing sacks
    const totalIncomingSacks = vehicles.reduce((acc, v) => acc + (v.incomingSackCount || 0), 0);
    const totalOutgoingSacks = vehicles.reduce((acc, v) => acc + (v.outgoingSackCount || 0), 0);
    
    let totalDuration = 0;
    let completedCountWithDuration = 0;
    completed.forEach(v => {
        if (v.dockingStartTime && v.exitTime) {
            const start = new Date(v.dockingStartTime).getTime();
            const end = new Date(v.exitTime).getTime();
            totalDuration += (end - start);
            completedCountWithDuration++;
        }
    });

    const avgTurnaround = completedCountWithDuration > 0 
        ? Math.floor((totalDuration / completedCountWithDuration) / 60000) 
        : 0;

    const canceledCount = Object.keys(canceledTrips).length;
    const waitingCount = Object.values(allRemainingTrips).reduce((total: number, count: number) => total + count, 0);

    return {
        totalVehicles: vehicles.length,
        avgTurnaroundMinutes: avgTurnaround,
        totalProducts,
        canceledCount,
        waitingCount: waitingCount,
        totalIncomingSacks,
        totalOutgoingSacks
    };
  }, [vehicles, ramps, allRemainingTrips, canceledTrips]);

  const isDayComplete = useMemo(() => {
    const hasActiveVehicles = vehicles.some(v => 
        v.status === VehicleStatus.WAITING || 
        v.status === VehicleStatus.DOCKING
    );
    const waitingCount = Object.values(allRemainingTrips).reduce((total: number, count: number) => total + count, 0);
    const hasActivity = vehicles.length > 0 || Object.keys(canceledTrips).length > 0;

    return !hasActiveVehicles && waitingCount === 0 && hasActivity;
  }, [vehicles, allRemainingTrips, canceledTrips]);

  // Handlers
  const handleLogin = (user: User) => {
    const newSessionId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    
    setCurrentUser(user);
    setCurrentSessionId(newSessionId);

    // Create new session object
    const newSession: ActiveSession = {
        username: user.username,
        name: user.name,
        loginTime: new Date().toISOString(),
        sessionId: newSessionId
    };
    
    // Remove ANY previous session for this username (enforce single session)
    const otherSessions = activeSessions.filter(s => s.username !== user.username);
    const newSessions = [...otherSessions, newSession];
    
    setActiveSessions(newSessions);
    pushUpdate({ activeSessions: newSessions });
    
    if (isFirebaseConfigured()) {
       addSystemLog({
         id: Date.now().toString(),
         actionType: 'LOGIN',
         description: 'Kullanıcı sisteme giriş yaptı.',
         performedBy: user.username,
         performedByName: user.name,
         timestamp: new Date().toISOString()
       });
    }
  };

  const handleLogout = () => {
    if (currentUser) {
        if (!isArchiveMode) {
            // Log action before destroying session state
            handleLogAction('LOGOUT', 'Kullanıcı sistemden çıkış yaptı.');

            // Remove from active sessions
            const newSessions = activeSessions.filter(s => s.username !== currentUser.username);
            setActiveSessions(newSessions);
            pushUpdate({ activeSessions: newSessions });
        }
    }
    
    setCurrentUser(null);
    setCurrentSessionId(null);
    setIsSettingsOpen(false);
    setIsModalOpen(false);
    setIsUserManagementOpen(false);
    setIsChatOpen(false);
    setIsLogsModalOpen(false);
    setIsArchiveListOpen(false);
  };

  const handleAddUser = (newUser: User) => {
    if (isArchiveMode) return;
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    pushUpdate({ users: updatedUsers });
    handleLogAction('USER_MGMT', `Yeni kullanıcı oluşturuldu: ${newUser.username} (${newUser.role})`);
  };

  const handleDeleteUser = (username: string) => {
    if (isArchiveMode) return;
    const updatedUsers = users.filter(u => u.username !== username);
    setUsers(updatedUsers);
    const updatedSessions = activeSessions.filter(s => s.username !== username);
    setActiveSessions(updatedSessions);
    pushUpdate({ users: updatedUsers, activeSessions: updatedSessions });
    handleLogAction('USER_MGMT', `Kullanıcı silindi: ${username}`);
  };

  // ADMIN MESSAGING HANDLERS
  const handleSendAdminMessage = (targetUsername: string, messageContent: string) => {
    if (!currentUser || isArchiveMode) return;
    
    const newMessage: AdminMessage = {
        id: Date.now().toString(),
        targetUsername,
        message: messageContent,
        sentAt: new Date().toISOString(),
        sentBy: currentUser.name
    };
    
    const newMessages = [...adminMessages, newMessage];
    setAdminMessages(newMessages);
    pushUpdate({ messages: newMessages });
    handleLogAction('USER_MGMT', `${targetUsername} kullanıcısına yönetici mesajı gönderildi.`);
  };

  const handleDismissAdminMessage = (id: string) => {
    if (isArchiveMode) return;
    const newMessages = adminMessages.filter(m => m.id !== id);
    setAdminMessages(newMessages);
    pushUpdate({ messages: newMessages });
  };

  // CHAT HANDLERS
  const handleSendChatMessage = (content: string) => {
    if (!currentUser || isArchiveMode) return;
    
    const message = {
        senderUsername: currentUser.username,
        senderName: currentUser.name,
        content: content,
        timestamp: new Date().toISOString()
    };
    
    sendChatMessage(message);
  };

  const handleClearChatHistory = async () => {
      if (!isAdmin || isArchiveMode || !isFirebaseConfigured()) return;
      
      await clearAllChatMessages();
      handleLogAction('CHAT_CLEANUP', 'Sohbet geçmişi yönetici tarafından tamamen temizlendi.');
  };
  
  const handleSaveChatSettings = (seconds: number) => {
      if (!isAdmin || isArchiveMode || !isFirebaseConfigured()) return;
      
      const newSettings: ChatSettings = {
          retentionSeconds: seconds,
          lastClearTime: new Date().toISOString(), // Initialize cycle immediately
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.username || 'admin'
      };
      
      saveChatSettings(newSettings);
      handleLogAction('UPDATE', `Sohbet otomatik silme süresi güncellendi: ${seconds} saniye.`);
  };

  const performEndDayReset = async () => {
    if (isArchiveMode) return; // Cannot reset from archive mode

    handleLogAction('RESET', 'Günü bitir işlemi uygulandı. Sistem verileri sıfırlandı.');

    // 1. SAVE ARCHIVE BEFORE RESETTING
    const archiveData: Omit<DailyArchive, 'id'> = {
        date: new Date().toISOString(),
        vehicles,
        scheduledTrips,
        canceledTrips,
        vehicleNotes,
        stats, // Using the memoized stats from current state
        closedBy: currentUser?.username || 'system'
    };
    
    if (isFirebaseConfigured()) {
        await saveDailyArchive(archiveData);
    }

    // 2. RESET STATE
    // Reset drivers state using DRIVER_REGISTRY
    const newDrivers = DRIVER_REGISTRY;
    // Reset available plates using keys from DRIVER_REGISTRY
    const newAvailablePlates = Object.keys(DRIVER_REGISTRY);

    const newVehicles = INITIAL_VEHICLES;
    const newRamps = createInitialRamps();
    const newScheduled = {};
    const newCanceled = {};
    const newNotes = {};

    setVehicles(newVehicles);
    setRamps(newRamps);
    setScheduledTrips(newScheduled);
    setCanceledTrips(newCanceled);
    setVehicleNotes(newNotes);
    setAvailablePlates(newAvailablePlates);
    setDrivers(newDrivers);

    if (isFirebaseConfigured()) {
        resetCloudData({
            vehicles: newVehicles,
            ramps: newRamps,
            scheduledTrips: newScheduled,
            canceledTrips: newCanceled,
            vehicleNotes: newNotes,
            availablePlates: newAvailablePlates,
            drivers: newDrivers,
            users, 
            activeSessions 
        });
    }
  };

  const handleAddScheduledTrip = (plate: string, count: number) => {
    if (isArchiveMode) return;
    const currentBase = scheduledTrips[plate] !== undefined 
        ? scheduledTrips[plate] 
        : (allRemainingTrips[plate] || 0);
        
    const newTotal = currentBase + count;
    
    const newScheduled = { ...scheduledTrips, [plate]: newTotal };
    setScheduledTrips(newScheduled);
    
    let newCanceled = { ...canceledTrips };
    if (canceledTrips[plate]) {
        delete newCanceled[plate];
        setCanceledTrips(newCanceled);
    } else {
        newCanceled = canceledTrips;
    }

    let newAvailable = availablePlates;
    let newDrivers = drivers;

    if (!availablePlates.includes(plate)) {
        newAvailable = [plate, ...availablePlates];
        setAvailablePlates(newAvailable);
        
        if (!newDrivers[plate]) {
            newDrivers = { ...drivers, [plate]: { name: '', phone: '' } };
            setDrivers(newDrivers);
        }
    }

    pushUpdate({ 
        scheduledTrips: newScheduled, 
        canceledTrips: newCanceled, 
        availablePlates: newAvailable, 
        drivers: newDrivers
    });

    handleLogAction('UPDATE', `${plate} için ${count} adet yeni sefer planlandı.`);
  };

  const handleBatchUpdateScheduledTrips = (
      updates: Record<string, number>, 
      newDriverData?: Record<string, DriverInfo>,
      deletedPlates?: string[]
  ) => {
    if (isArchiveMode) return;
    let finalAvailablePlates = [...availablePlates];
    let finalDrivers = { ...drivers };
    let finalScheduledTrips = { ...scheduledTrips };
    let finalNotes = { ...vehicleNotes };

    if (deletedPlates && deletedPlates.length > 0) {
        const deletedSet = new Set(deletedPlates);
        
        finalAvailablePlates = finalAvailablePlates.filter(p => !deletedSet.has(p));
        
        deletedPlates.forEach(p => {
            delete finalDrivers[p];
            delete finalScheduledTrips[p];
            delete finalNotes[p];
        });
        
        handleLogAction('UPDATE', `Toplu düzenleme ile ${deletedPlates.length} araç silindi: ${deletedPlates.join(', ')}`);
    }

    const validUpdates: Record<string, number> = {};
    Object.keys(updates).forEach(key => {
        if (!deletedPlates?.includes(key)) {
            validUpdates[key] = updates[key];
        }
    });
    
    finalScheduledTrips = { ...finalScheduledTrips, ...validUpdates };
    
    const platesToRestore = Object.keys(validUpdates).filter(plate => validUpdates[plate] > 0);
    const newCanceled = { ...canceledTrips };
    platesToRestore.forEach(plate => {
        if (newCanceled[plate]) delete newCanceled[plate];
    });

    const newPlates = Object.keys(validUpdates);
    newPlates.forEach(plate => {
        if (!finalAvailablePlates.includes(plate)) finalAvailablePlates.push(plate);
    });

    if (newDriverData && Object.keys(newDriverData).length > 0) {
        const validNewDrivers: Record<string, DriverInfo> = {};
        Object.keys(newDriverData).forEach(key => {
            if (!deletedPlates?.includes(key)) {
                validNewDrivers[key] = newDriverData[key];
                handleLogAction('UPDATE', `Listeye yeni araç eklendi: ${key} (${newDriverData[key].name})`);
            }
        });
        finalDrivers = { ...finalDrivers, ...validNewDrivers };
    }

    setScheduledTrips(finalScheduledTrips);
    setCanceledTrips(newCanceled);
    setAvailablePlates(finalAvailablePlates);
    setDrivers(finalDrivers);
    setVehicleNotes(finalNotes);
    
    pushUpdate({
        scheduledTrips: finalScheduledTrips,
        canceledTrips: newCanceled,
        availablePlates: finalAvailablePlates,
        drivers: finalDrivers,
        vehicleNotes: finalNotes
    });
    
    handleLogAction('UPDATE', 'Sefer listesi toplu olarak güncellendi.');
  };

  const handleAssignFromPlanned = (plate: string) => {
    if (isArchiveMode) return;
    setTargetPlate(plate);
    setTargetProductCount(null);
    setIsModalOpen(true);
  };

  // --- CONFIRMATION HANDLERS START ---

  const initiateCancelTrip = (plate: string) => {
    if (isArchiveMode) return;
    setConfirmState({
      isOpen: true,
      action: 'CANCEL_PLANNED',
      targetId: plate,
      title: 'Seferi İptal Et',
      message: `${plate} plakalı araç için planlanan seferi iptal etmek istediğinize emin misiniz?`,
      isDanger: true
    });
  };

  const performCancelTrip = (plate: string) => {
    const currentCount = allRemainingTrips[plate];
    if (currentCount > 0) {
        
        const newCanceled = { ...canceledTrips, [plate]: currentCount };
        setCanceledTrips(newCanceled);

        const newVehicles = vehicles.filter(v => {
            if (v.licensePlate === plate) {
                if (v.status === VehicleStatus.INCOMING) {
                    return false;
                }
                if (v.status === VehicleStatus.WAITING) {
                    v.status = VehicleStatus.CANCELED;
                    return true;
                }
            }
            return true;
        });

        setVehicles(newVehicles);

        pushUpdate({ 
            canceledTrips: newCanceled, 
            vehicles: newVehicles 
        });
        
        handleLogAction('CANCEL', `${plate} plakalı aracın seferi iptal edildi.`);
    }
  };

  const initiateCancelWaitingVehicle = (vehicleId: string) => {
    if (isArchiveMode) return;
    setConfirmState({
      isOpen: true,
      action: 'CANCEL_WAITING',
      targetId: vehicleId,
      title: 'Sıradan Sil',
      message: 'Bu aracı bekleme sırasından silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      isDanger: true
    });
  };

  const performCancelWaitingVehicle = (vehicleId: string) => {
    const vehicleToCancel = vehicles.find(v => v.id === vehicleId);
    
    // Completely remove vehicle from the list instead of marking as CANCELED
    const newVehicles = vehicles.filter(v => v.id !== vehicleId);
    setVehicles(newVehicles);

    let newScheduled = scheduledTrips;
    if (vehicleToCancel) {
      const plate = vehicleToCancel.licensePlate;
      const currentScheduled = scheduledTrips[plate];
      if (currentScheduled !== undefined) {
         newScheduled = { ...scheduledTrips, [plate]: currentScheduled + 1 };
      } else {
         newScheduled = { ...scheduledTrips, [plate]: 1 };
      }
      setScheduledTrips(newScheduled);
      handleLogAction('CANCEL', `${plate} plakalı araç sıradan çıkarıldı.`);
    }
    
    pushUpdate({ vehicles: newVehicles, scheduledTrips: newScheduled });
  };

  const initiateClearRamp = (rampId: string) => {
    if (isArchiveMode) return;
    setCompletingRampId(rampId);
  };

  const handleCompleteRamp = (incomingSacks: number, outgoingSacks: number) => {
    if (!completingRampId) return;
    performClearRamp(completingRampId, incomingSacks, outgoingSacks);
    setCompletingRampId(null);
  };

  const performClearRamp = (rampId: string, incomingSacks: number, outgoingSacks: number) => {
    const ramp = ramps.find(r => r.id === rampId);
    if (!ramp || !ramp.currentVehicleId) return;

    const vehicleId = ramp.currentVehicleId;
    const vehicle = vehicles.find(v => v.id === vehicleId);

    const newVehicles = vehicles.map(v => 
        v.id === vehicleId 
            ? { 
                ...v, 
                status: VehicleStatus.COMPLETED, 
                exitTime: new Date().toISOString(),
                incomingSackCount: incomingSacks,
                outgoingSackCount: outgoingSacks
              } 
            : v
    );
    setVehicles(newVehicles);

    const newRamps = ramps.map(r => 
        r.id === rampId 
            ? { ...r, status: 'FREE' as const, currentVehicleId: null } 
            : r
    );
    setRamps(newRamps);

    pushUpdate({ vehicles: newVehicles, ramps: newRamps });
    if(vehicle) {
        handleLogAction('RAMP_CLEAR', `${vehicle.licensePlate} işlemi tamamlandı. Rampa: ${ramp.name}. Gelen Çuval: ${incomingSacks}, Giden Çuval: ${outgoingSacks}`);
    }
  };

  const initiateRevertRamp = (rampId: string) => {
    if (isArchiveMode) return;
    setConfirmState({
      isOpen: true,
      action: 'REVERT_RAMP',
      targetId: rampId,
      title: 'Atamayı Geri Al',
      message: 'Araç rampadan alınacak ve tekrar "Planlanan Seferler" listesine eklenecektir. Bu işlem hatalı atamaları düzeltmek içindir. Onaylıyor musunuz?',
      isDanger: true
    });
  };

  const performRevertRamp = (rampId: string) => {
    const ramp = ramps.find(r => r.id === rampId);
    if (!ramp || !ramp.currentVehicleId) return;
    
    const vehicleId = ramp.currentVehicleId;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    const newRamps = ramps.map(r => 
        r.id === rampId 
            ? { ...r, status: 'FREE' as const, currentVehicleId: null } 
            : r
    );
    setRamps(newRamps);

    const newVehicles = vehicles.filter(v => v.id !== vehicleId);
    setVehicles(newVehicles);

    let newScheduled = scheduledTrips;
    if (vehicle) {
        const plate = vehicle.licensePlate;
        const currentScheduled = scheduledTrips[plate];
        
        if (currentScheduled !== undefined) {
             newScheduled = { ...scheduledTrips, [plate]: currentScheduled + 1 };
        } else {
             newScheduled = { ...scheduledTrips, [plate]: 1 };
        }
        setScheduledTrips(newScheduled);
        handleLogAction('CANCEL', `${plate} rampa ataması geri alındı. Rampa: ${ramp.name}`);
    }

    pushUpdate({
        ramps: newRamps,
        vehicles: newVehicles,
        scheduledTrips: newScheduled
    });
  };

  const executeConfirmation = () => {
    const { action, targetId } = confirmState;
    if (!action || !targetId) return;

    if (action === 'CLEAR_RAMP') {
       // Handled by CompleteRampModal
    } else if (action === 'CANCEL_WAITING') {
      performCancelWaitingVehicle(targetId);
    } else if (action === 'CANCEL_PLANNED') {
      performCancelTrip(targetId);
    } else if (action === 'REVERT_RAMP') {
      performRevertRamp(targetId);
    }
  };

  // --- CONFIRMATION HANDLERS END ---

  const handleRemoveOneTrip = (plate: string) => {
    if (isArchiveMode) return;
    // Determine the history count to find the specific trip number being removed
    const historyCount = vehicles.filter(v => 
        v.licensePlate === plate && 
        v.status !== VehicleStatus.CANCELED && 
        v.status !== VehicleStatus.INCOMING
    ).length;

    const currentCount = allRemainingTrips[plate];
    const currentScheduled = scheduledTrips[plate];
    
    // The specific trip number is history count + current scheduled count
    // Example: 1 in history, 2 scheduled. We are removing trip #3.
    const tripToRemove = historyCount + currentCount;
    const noteKey = `${plate}-${tripToRemove}`;

    // Remove Note if exists
    let newNotes = { ...vehicleNotes };
    if (newNotes[noteKey]) {
        delete newNotes[noteKey];
        setVehicleNotes(newNotes);
    }

    if (currentCount >= 1) {
        if (currentScheduled !== undefined && currentScheduled > 1) {
            const newScheduled = { ...scheduledTrips, [plate]: currentScheduled - 1 };
            setScheduledTrips(newScheduled);
            pushUpdate({ scheduledTrips: newScheduled, vehicleNotes: newNotes });
        } else if (currentScheduled === undefined || currentScheduled === 1) {
            // If explicit 1, or implicit 1 (allRemainingTrips)
            // If explicit 1 -> 0
            // If undefined (implicit 1) -> 0
            const countToSet = (currentScheduled || currentCount) - 1;
            const newScheduled = { ...scheduledTrips, [plate]: countToSet };
            setScheduledTrips(newScheduled);
            pushUpdate({ scheduledTrips: newScheduled, vehicleNotes: newNotes });
        }
        handleLogAction('UPDATE', `${plate} için sefer sayısı 1 azaltıldı (Sefer ${tripToRemove}). Not silindi.`);
    }
  };

  const handleRestoreTrip = (plate: string) => {
    if (isArchiveMode) return;
    const newCanceled = { ...canceledTrips };
    delete newCanceled[plate];
    setCanceledTrips(newCanceled);

    pushUpdate({ 
        canceledTrips: newCanceled
    });
    handleLogAction('UPDATE', `${plate} iptal edilen seferlerden geri yüklendi.`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTargetPlate('');
    setTargetProductCount(null);
  };

  const handleAddVehicle = (data: { licensePlate: string; productCount: number; rampId: string | null; driverName?: string; driverPhone?: string }) => {
    if (isArchiveMode) return;
    const newVehicleId = Math.random().toString(36).substr(2, 9);
    const previousTrips = vehicles.filter(v => v.licensePlate === data.licensePlate).length;
    const currentTripCount = previousTrips + 1;

    const newVehicle: Vehicle = {
      id: newVehicleId,
      licensePlate: data.licensePlate,
      productCount: data.productCount,
      arrivalTime: new Date().toISOString(),
      status: data.rampId ? VehicleStatus.DOCKING : VehicleStatus.WAITING,
      rampId: data.rampId,
      dockingStartTime: data.rampId ? new Date().toISOString() : undefined,
      tripCount: currentTripCount
    };
    
    const newVehicles = [newVehicle, ...vehicles.filter(v => !(v.licensePlate === data.licensePlate && v.status === VehicleStatus.INCOMING))];
    setVehicles(newVehicles);

    let newScheduled = scheduledTrips;
    let newRamps = ramps;

    if (data.rampId) {
        const currentScheduled = scheduledTrips[data.licensePlate];
        if (currentScheduled !== undefined && currentScheduled > 0) {
            newScheduled = { ...scheduledTrips, [data.licensePlate]: currentScheduled - 1 };
            setScheduledTrips(newScheduled);
        }

        newRamps = ramps.map(ramp => 
            ramp.id === data.rampId 
                ? { ...ramp, status: 'OCCUPIED' as const, currentVehicleId: newVehicleId } 
                : ramp
        );
        setRamps(newRamps);
        const rampName = ramps.find(r => r.id === data.rampId)?.name;
        handleLogAction('RAMP_ASSIGN', `${data.licensePlate} doğrudan rampaya atandı. (${rampName})`);
    } else {
        const currentScheduled = scheduledTrips[data.licensePlate];
        if (currentScheduled !== undefined && currentScheduled > 0) {
             newScheduled = { ...scheduledTrips, [data.licensePlate]: currentScheduled - 1 };
             setScheduledTrips(newScheduled);
        } else if (currentScheduled === undefined && allRemainingTrips[data.licensePlate] > 0) {
             newScheduled = { ...scheduledTrips, [data.licensePlate]: 0 }; 
             setScheduledTrips(newScheduled);
        }
        handleLogAction('VEHICLE_ADD', `${data.licensePlate} kuyruğa giriş yaptı.`);
    }

    let newAvailable = availablePlates;
    let newDrivers = drivers;

    if (!availablePlates.includes(data.licensePlate)) {
        newAvailable = [data.licensePlate, ...availablePlates];
        setAvailablePlates(newAvailable);
        
        if (!newDrivers[data.licensePlate]) {
            newDrivers = { ...drivers, [data.licensePlate]: { name: '', phone: '' } };
            setDrivers(newDrivers);
        }
    }
    
    pushUpdate({ 
        vehicles: newVehicles, 
        ramps: newRamps, 
        scheduledTrips: newScheduled, 
        availablePlates: newAvailable, 
        drivers: newDrivers
    });
  };

  const handleAddNote = (plate: string, note: string, tripNumber: number) => {
    if (isArchiveMode) return;
    const key = `${plate}-${tripNumber}`;
    const newNotes = { ...vehicleNotes, [key]: note };
    setVehicleNotes(newNotes);
    pushUpdate({ vehicleNotes: newNotes });
    handleLogAction('UPDATE', `${plate} aracına (${tripNumber}. Sefer) not eklendi.`);
  };

  const handleAddPlateToData = (newPlate: string) => {
    if (isArchiveMode) return;
    if (!availablePlates.includes(newPlate)) {
        const newAvailable = [newPlate, ...availablePlates];
        setAvailablePlates(newAvailable);
        
        const newDrivers = { ...drivers, [newPlate]: { name: '', phone: '' } };
        setDrivers(newDrivers);

        pushUpdate({ availablePlates: newAvailable, drivers: newDrivers });
        handleLogAction('UPDATE', `${newPlate} sisteme yeni araç olarak kaydedildi.`);
    }
  };

  const handleOpenAssignModal = (vehicleId: string) => {
    if (isArchiveMode) return;
    setAssigningVehicleId(vehicleId);
  };

  const handleConfirmAssignment = (rampId: string) => {
    if (!assigningVehicleId || isArchiveMode) return;

    let newScheduled = scheduledTrips;

    const newRamps = ramps.map(ramp => 
        ramp.id === rampId 
            ? { ...ramp, status: 'OCCUPIED' as const, currentVehicleId: assigningVehicleId } 
            : ramp
    );
    setRamps(newRamps);

    const vehicle = vehicles.find(v => v.id === assigningVehicleId);
    const newVehicles = vehicles.map(v => 
        v.id === assigningVehicleId 
            ? { ...v, status: VehicleStatus.DOCKING, rampId: rampId, dockingStartTime: new Date().toISOString() } 
            : v
    );
    setVehicles(newVehicles);
    
    setAssigningVehicleId(null);

    pushUpdate({ 
        ramps: newRamps, 
        vehicles: newVehicles, 
        scheduledTrips: newScheduled 
    });

    const rampName = ramps.find(r => r.id === rampId)?.name;
    if (vehicle) {
        handleLogAction('RAMP_ASSIGN', `${vehicle.licensePlate} rampaya atandı. (${rampName})`);
    }
  };

  const handleUpdateDriver = (plate: string, name: string, phone: string) => {
    if (isArchiveMode) return;
    const newDrivers = { ...drivers, [plate]: { name, phone } };
    setDrivers(newDrivers);
    pushUpdate({ drivers: newDrivers });
    handleLogAction('UPDATE', `${plate} sürücü bilgileri güncellendi.`);
  };

  // Quantity Edit Handlers
  const openEditQuantity = (vehicleId: string, currentCount: number, incomingSacks: number = 0, outgoingSacks: number = 0, hideSacks: boolean = false) => {
    if (isArchiveMode) return;
    setEditingVehicleId(vehicleId);
    setEditingValues({
        count: currentCount,
        incomingSacks,
        outgoingSacks
    });
    setHideSackFieldsInEdit(hideSacks);
    setIsEditQuantityModalOpen(true);
  };

  const handleUpdateQuantity = (newCount: number, newIncoming: number, newOutgoing: number) => {
    if (!editingVehicleId || isArchiveMode) return;
    
    const vehicle = vehicles.find(v => v.id === editingVehicleId);
    const newVehicles = vehicles.map(v => 
        v.id === editingVehicleId 
            ? { ...v, productCount: newCount, incomingSackCount: newIncoming, outgoingSackCount: newOutgoing } 
            : v
    );
    setVehicles(newVehicles);
    pushUpdate({ vehicles: newVehicles });
    
    setIsEditQuantityModalOpen(false);
    setEditingVehicleId(null);

    if (vehicle) {
        const oldQuantity = vehicle.productCount;
        handleLogAction('UPDATE', `${vehicle.licensePlate} bilgileri güncellendi. Yük: ${oldQuantity}->${newCount}, Çuval(G):${newIncoming}, Çuval(Ç):${newOutgoing}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Archive Mode Banner */}
      {isArchiveMode && archiveDate && (
          <div className="bg-indigo-600 text-white px-6 py-3 shadow-md sticky top-0 z-[60] flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <Eye size={24} className="animate-pulse" />
                  <div>
                      <h2 className="font-bold text-lg leading-none">Geçmiş Kayıt İnceleme Modu</h2>
                      <p className="text-xs text-indigo-200">
                          {new Date(archiveDate).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} tarihli kayıt görüntüleniyor.
                      </p>
                  </div>
              </div>
              <button 
                onClick={() => {
                    window.close(); // Try to close tab
                    // Fallback if script can't close
                    window.location.href = window.location.pathname; 
                }}
                className="px-4 py-2 bg-white text-indigo-700 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors"
              >
                  Moddan Çık
              </button>
          </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-600 p-2 rounded-lg">
                <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex flex-col sm:flex-row sm:gap-1 leading-none sm:leading-normal">
                    <span>Ayazağa</span>
                    <span className="text-orange-600">Inbound</span>
                </h1>
                <div className="flex items-center gap-2">
                    {isArchiveMode ? (
                        <span className="flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-bold border border-indigo-100">
                            <Eye size={10} /> Salt Okunur
                        </span>
                    ) : isFirebaseConfigured() ? (
                        isSynced ? (
                             <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-100">
                                <Cloud size={10} /> Canlı Senkronizasyon
                             </span>
                        ) : (
                             <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-100 animate-pulse">
                                <Cloud size={10} /> Bağlanıyor...
                             </span>
                        )
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-medium border border-slate-200" title="Firebase yapılandırılmadı">
                             <CloudOff size={10} /> Çevrimdışı Mod
                        </span>
                    )}
                </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
                <>
                    <div className="hidden md:flex items-center space-x-2 text-sm text-slate-500 border-r border-slate-200 pr-4 mr-1">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${isAdmin ? 'bg-purple-500' : 'bg-emerald-500'}`}></span>
                        <div className="flex flex-col items-end leading-tight">
                             <span className="font-medium text-slate-700">{currentUser.name}</span>
                             {isAdmin && <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1 rounded">ADMIN</span>}
                        </div>
                    </div>
                    {isAdmin && !isArchiveMode && (
                        <>
                            <button
                                onClick={() => setIsLogsModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors text-sm font-medium border border-indigo-100"
                                title="Sistem Kayıtları"
                            >
                                <FileClock size={18} />
                                <span className="hidden sm:inline">Loglar</span>
                            </button>
                            <button
                                onClick={() => setIsUserManagementOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors text-sm font-medium border border-purple-100"
                            >
                                <Users size={18} />
                                <span className="hidden sm:inline">Kullanıcılar</span>
                            </button>
                        </>
                    )}
                    {!isArchiveMode && (
                        <button 
                            onClick={() => setIsArchiveListOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors text-sm font-medium border border-indigo-100"
                            title="Geçmiş Kayıtlar"
                        >
                            <Archive size={18} />
                            <span className="hidden sm:inline">Geçmiş</span>
                        </button>
                    )}
                    {!isArchiveMode && (
                        <button 
                            onClick={() => setIsSettingsOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors text-sm font-medium border border-slate-200"
                        >
                            <LayoutDashboard size={18} />
                            <span>Panel</span>
                        </button>
                    )}
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors text-sm font-medium border border-rose-100"
                    >
                        <LogOut size={18} />
                        <span className="hidden sm:inline">Çıkış</span>
                    </button>
                </>
            ) : (
                <button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-bold shadow-lg shadow-orange-200"
                >
                    <LogIn size={18} />
                    <span>Personel Girişi</span>
                </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Operation Complete Banner */}
        {isLoggedIn && isDayComplete && !isArchiveMode && (
          <div className="mb-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-orange-100 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black opacity-5 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                        <CheckCircle2 size={40} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Tüm Operasyonlar Tamamlandı</h2>
                        <p className="text-orange-50 text-sm md:text-base opacity-90">
                            Sırada bekleyen veya işlem gören araç bulunmamaktadır. Sistemi bir sonraki gün için sıfırlayabilirsiniz.
                        </p>
                    </div>
                </div>

                <button 
                    onClick={() => setIsEndDayConfirmOpen(true)}
                    className="flex-shrink-0 flex items-center gap-3 px-6 py-3.5 bg-white text-orange-700 rounded-xl hover:bg-orange-50 transition-all font-bold text-sm md:text-base shadow-lg group whitespace-nowrap"
                >
                    <RotateCcw className="group-hover:-rotate-180 transition-transform duration-700" size={20} />
                    Sistemi Sıfırla (Yeni Gün)
                </button>
            </div>
          </div>
        )}

        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Operasyon Özeti</h2>
            <p className="text-slate-500 mt-1">Gelen araç trafiği ve rampa yönetimi.</p>
          </div>
          {isLoggedIn && !isArchiveMode && (
              <div className="flex flex-wrap gap-3">
                <button 
                    onClick={() => setIsNoteModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-bold text-sm shadow-md shadow-yellow-200"
                >
                    <StickyNote size={16} />
                    Not Ekle
                </button>
                <button 
                    onClick={() => setIsDriverModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm border border-emerald-200"
                >
                    <Phone size={16} />
                    Sürücüleri Ara
                </button>
                <button 
                    onClick={() => setIsTripModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm border border-slate-200"
                >
                    <Repeat size={16} />
                    Sefer Planla
                </button>
              </div>
          )}
        </div>

        {/* Stats Cards */}
        <StatsOverview stats={stats} isLoggedIn={isLoggedIn} />

        {/* Ramps */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-700">Rampa Durumu</h3>
                {!isArchiveMode && <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-md">Canlı İzleme</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ramps.map(ramp => (
                <div key={ramp.id} className="h-full">
                    <RampCard 
                        ramp={ramp} 
                        vehicle={vehicles.find(v => v.id === ramp.currentVehicleId)}
                        onClearRamp={initiateClearRamp}
                        onRevertAssignment={isLoggedIn ? initiateRevertRamp : undefined}
                        readOnly={!isLoggedIn || isArchiveMode}
                    />
                </div>
            ))}
            </div>
        </div>

        {/* Main Content */}
        <div className="w-full">
            
            {/* Vehicle Log */}
            <VehicleList 
                vehicles={logVehicles} 
                onAssignRamp={handleOpenAssignModal}
                onCancelWaiting={initiateCancelWaitingVehicle}
                onEditQuantity={isLoggedIn ? openEditQuantity : undefined}
                readOnly={!isLoggedIn || isArchiveMode}
            />

            {/* Planned Trips */}
            <PlannedTripsList 
                scheduledTrips={allRemainingTrips}
                canceledTrips={canceledTrips}
                drivers={drivers}
                vehicleNotes={vehicleNotes}
                onAssign={handleAssignFromPlanned}
                onCancel={initiateCancelTrip}
                onRemoveOneTrip={handleRemoveOneTrip}
                onRestore={handleRestoreTrip}
                readOnly={!isLoggedIn || isArchiveMode}
                vehicles={vehicles}
                onOpenEditor={() => setIsPlannedTripsEditorOpen(true)}
                onEditQuantity={isLoggedIn ? openEditQuantity : undefined}
                onAssignRamp={handleOpenAssignModal}
            />
        </div>
      </main>

      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        users={users}
      />

      {isLoggedIn && !isArchiveMode && (
        <>
            {/* Chat Floating Button */}
            {!isChatOpen && (
              <button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-6 right-6 z-[100] flex items-center justify-center p-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full shadow-2xl hover:shadow-orange-500/30 hover:scale-105 transition-all group"
                title="Ekip Sohbeti"
              >
                <div className="relative">
                    <MessageSquare size={24} className="group-hover:animate-bounce" />
                    {unreadChatCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-white text-red-600 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-red-100 animate-pulse shadow-sm">
                            {unreadChatCount > 9 ? '9+' : unreadChatCount}
                        </span>
                    )}
                </div>
              </button>
            )}

            {/* Chat Modal */}
            <ChatModal 
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              messages={chatMessages}
              currentUser={currentUser!}
              onSendMessage={handleSendChatMessage}
              retentionSeconds={chatSettings?.retentionSeconds || 0}
            />

            <AddVehicleModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSubmit={handleAddVehicle}
                ramps={ramps}
                currentVehicles={vehicles}
                availablePlates={availablePlates}
                onAddPlate={handleAddPlateToData}
                initialPlate={targetPlate}
                initialProductCount={targetProductCount}
            />

            <AddTripModal
                isOpen={isTripModalOpen}
                onClose={() => setIsTripModalOpen(false)}
                onSubmit={handleAddScheduledTrip}
                availablePlates={availablePlates}
            />

            <AddNoteModal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                onSave={handleAddNote}
                availablePlates={availablePlates}
                vehicleNotes={vehicleNotes}
                vehicles={vehicles}
                scheduledTrips={allRemainingTrips}
            />

            <PlannedTripsEditorModal
                isOpen={isPlannedTripsEditorOpen}
                onClose={() => setIsPlannedTripsEditorOpen(false)}
                drivers={drivers}
                availablePlates={availablePlates}
                scheduledTrips={scheduledTrips}
                onSave={handleBatchUpdateScheduledTrips}
            />

            <EditQuantityModal
                isOpen={isEditQuantityModalOpen}
                onClose={() => setIsEditQuantityModalOpen(false)}
                onSave={handleUpdateQuantity}
                currentQuantity={editingValues.count}
                currentIncomingSacks={editingValues.incomingSacks}
                currentOutgoingSacks={editingValues.outgoingSacks}
                hideSackFields={hideSackFieldsInEdit}
            />

            <AssignRampModal
                isOpen={!!assigningVehicleId}
                onClose={() => setAssigningVehicleId(null)}
                onConfirm={handleConfirmAssignment}
                ramps={ramps}
            />

            <DriverListModal
                isOpen={isDriverModalOpen}
                onClose={() => setIsDriverModalOpen(false)}
                drivers={drivers}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                drivers={drivers}
                onUpdateDriver={handleUpdateDriver}
                availablePlates={availablePlates}
                onSystemReset={() => setIsEndDayConfirmOpen(true)}
            />

            <ArchiveListModal
                isOpen={isArchiveListOpen}
                onClose={() => setIsArchiveListOpen(false)}
            />

            {isAdmin && currentUser && (
                <>
                    <UserManagementModal
                        isOpen={isUserManagementOpen}
                        onClose={() => setIsUserManagementOpen(false)}
                        users={users}
                        activeSessions={activeSessions}
                        onAddUser={handleAddUser}
                        onDeleteUser={handleDeleteUser}
                        currentUser={currentUser}
                        onSendMessage={handleSendAdminMessage}
                        onClearChat={handleClearChatHistory}
                        onSaveChatSettings={handleSaveChatSettings}
                        currentRetentionSeconds={chatSettings?.retentionSeconds || 0}
                    />
                    <AdminLogsModal
                        isOpen={isLogsModalOpen}
                        onClose={() => setIsLogsModalOpen(false)}
                        logs={systemLogs}
                    />
                </>
            )}
            
            {/* Admin Message Display Modal for Users */}
            {currentUser && adminMessages.filter(m => m.targetUsername === currentUser.username).map(msg => (
                <AdminMessageModal
                    key={msg.id}
                    isOpen={true}
                    onClose={() => handleDismissAdminMessage(msg.id)}
                    message={msg}
                />
            ))}

            {/* End Day Confirmation */}
            <ConfirmModal 
                isOpen={isEndDayConfirmOpen}
                onClose={() => setIsEndDayConfirmOpen(false)}
                onConfirm={performEndDayReset}
                title="Günü Bitir"
                message="Tüm operasyon verilerini temizleyip günü bitirmek üzeresiniz. Bu işlem geri alınamaz. Onaylıyor musunuz?"
                confirmText="Sistemi Sıfırla"
                cancelText="Vazgeç"
                isDanger={true}
            />

            {/* Ramp Completion Modal */}
            <CompleteRampModal 
                isOpen={!!completingRampId}
                onClose={() => setCompletingRampId(null)}
                onConfirm={handleCompleteRamp}
                vehiclePlate={ramps.find(r => r.id === completingRampId)?.currentVehicleId 
                    ? vehicles.find(v => v.id === ramps.find(r => r.id === completingRampId)?.currentVehicleId)?.licensePlate || ''
                    : ''
                }
            />

            {/* Generic Confirmation for Actions (Clear Ramp, Cancel Waiting, Cancel Planned) */}
            <ConfirmModal 
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeConfirmation}
                title={confirmState.title}
                message={confirmState.message}
                confirmText="Onayla"
                cancelText="Vazgeç"
                isDanger={confirmState.isDanger}
            />
        </>
      )}
    </div>
  );
};

export default App;
