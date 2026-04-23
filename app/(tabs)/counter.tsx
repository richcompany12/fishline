/**
 * counter.tsx
 *
 * 수정 내용:
 * [BUG4] AppState 동기화: 앱 복귀 시 getFloatingItems()로 최종 카운트 반영
 * [BUG5] 마운트 시 즉시 updateFloatingItems() 호출 → 서비스가 처음부터 데이터 보유
 * [BUG7] listenFloatingSyncCount() 구독 → 플로팅 버튼 탭 시 앱 UI 실시간 갱신
 * [NEW] 항목 길게누르기 → 이름 변경 기능 추가
 */

import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, Modal,
  Platform, AppState, DeviceEventEmitter,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  updateFloatingItems,
  getFloatingItems,
  listenFloatingSyncCount,
} from '@/lib/FloatingService';

export default function CounterScreen() {
 const { items, curId, setCurId, addItem,
        deleteItem, plusCount, minusCount, resetAll,
        resetItem,
        renameItem  // ⭐ 추가
      } = useAppStore();

  const [newName,  setNewName]  = useState('');
  const [showAdd,  setShowAdd]  = useState(false);
  const [logs,     setLogs]     = useState<{ name: string; count: number; time: string }[]>([]);

  
    // ⭐ 길게누르기 메뉴 모달 상태
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionTargetId, setActionTargetId] = useState<string>('');
  // ⭐ 이름 변경 모달 상태
  const [showRename, setShowRename] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string>('');
  const [renameValue, setRenameValue] = useState('');

  const curItem = items.find(i => i.id === curId) || items[0];

  // items의 최신 값을 클로저 밖에서도 참조하기 위한 ref
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // ─────────────────────────────────────────────
  // [BUG5] 마운트 시 즉시 서비스로 현재 데이터 push
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const idx = items.findIndex(i => i.id === curId);
    updateFloatingItems(
      items.map(i => ({ name: i.name, count: i.count })),
      idx >= 0 ? idx : 0
    );
  }, []);

  // ─────────────────────────────────────────────
  // items / curId 변경 시 서비스 동기화
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const idx = items.findIndex(i => i.id === curId);
    updateFloatingItems(
      items.map(i => ({ name: i.name, count: i.count })),
      idx >= 0 ? idx : 0,
      true
    );
  }, [items, curId]);

  // ─────────────────────────────────────────────
  // [BUG7] 플로팅 버튼 탭 → 앱 UI 실시간 갱신
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const sub = listenFloatingSyncCount(({ items: floatItems }) => {
      const currentItems = itemsRef.current;
      floatItems.forEach((floatItem) => {
        const storeItem = currentItems.find(i => i.name === floatItem.name);
        if (!storeItem) return;
        const diff = floatItem.count - storeItem.count;
        if (diff > 0) {
          for (let k = 0; k < diff; k++) plusCount(storeItem.id);
          setLogs(prev => [{
            name:  floatItem.name,
            count: floatItem.count,
            time:  new Date().toLocaleTimeString('ko', { hour: '2-digit', minute: '2-digit' }),
          }, ...prev].slice(0, 10));
        }
      });
    });

    return () => sub.remove();
  }, []);

  // ─────────────────────────────────────────────
  // [BUG4] 앱 포그라운드 복귀 시 최종 상태 동기화
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active') return;
      const data = await getFloatingItems();
      if (!data || data.items.length === 0) return;

      const currentItems = itemsRef.current;
      data.items.forEach((floatItem) => {
        const storeItem = currentItems.find(i => i.name === floatItem.name);
        if (!storeItem) return;
        const diff = floatItem.count - storeItem.count;
        if (diff > 0) {
          for (let k = 0; k < diff; k++) plusCount(storeItem.id);
        }
      });
    });

    const startSub = DeviceEventEmitter.addListener('FloatingServiceStarted', () => {
      const currentItems = itemsRef.current;
      const currentCurId = curId;
      const idx = currentItems.findIndex(i => i.id === currentCurId);
      updateFloatingItems(
        currentItems.map(i => ({ name: i.name, count: i.count })),
        idx >= 0 ? idx : 0,
        false
      );
    });

    return () => {
      sub.remove();
      startSub.remove();
    };
  }, []);

  // ─────────────────────────────────────────────
  // 카운터 조작
  // ─────────────────────────────────────────────
  const handlePlus = () => {
    if (!curItem) return;
    plusCount(curItem.id);
    setLogs(prev => [{
      name:  curItem.name,
      count: curItem.count + 1,
      time:  new Date().toLocaleTimeString('ko', { hour: '2-digit', minute: '2-digit' }),
    }, ...prev].slice(0, 10));
  };

  const handleMinus = () => {
    if (curItem) minusCount(curItem.id);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addItem(newName.trim());
    setNewName('');
    setShowAdd(false);
  };

  // ⭐ 이름 변경 모달 열기
  const openRenameModal = (id: string, currentName: string) => {
    setRenameTargetId(id);
    setRenameValue(currentName);
    setShowRename(true);
  };

  // ⭐ 이름 변경 확정
  const handleRenameConfirm = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      Alert.alert('오류', '이름을 입력해주세요.');
      return;
    }
    renameItem(renameTargetId, trimmed);
    setShowRename(false);
    setRenameTargetId('');
    setRenameValue('');
  };

  // ⭐ 길게누르기 → 커스텀 메뉴 모달 열기
  const handleLongPressItem = (id: string) => {
    setActionTargetId(id);
    setShowActionMenu(true);
  };

  // 메뉴에서 "이름 변경" 선택
  const handleActionRename = () => {
    const name = items.find(i => i.id === actionTargetId)?.name || '';
    setShowActionMenu(false);
    // 작은 지연 후 이름 변경 모달 열기 (모달 애니메이션 충돌 방지)
    setTimeout(() => openRenameModal(actionTargetId, name), 200);
  };

  // 메뉴에서 "리셋" 선택
  const handleActionReset = () => {
    const name = items.find(i => i.id === actionTargetId)?.name;
    setShowActionMenu(false);
    setTimeout(() => {
      Alert.alert(
        '리셋',
        `"${name}" 카운트를 0으로 초기화할까요?`,
        [
          { text: '취소', style: 'cancel' },
          { text: '리셋', style: 'destructive',
            onPress: () => resetItem(actionTargetId) },
        ]
      );
    }, 200);
  };

  // 메뉴에서 "삭제" 선택
  const handleActionDelete = () => {
    const name = items.find(i => i.id === actionTargetId)?.name;
    setShowActionMenu(false);
    setTimeout(() => {
      Alert.alert(
        '삭제',
        `"${name}"을 삭제할까요?`,
        [
          { text: '취소', style: 'cancel' },
          { text: '삭제', style: 'destructive',
            onPress: () => deleteItem(actionTargetId) },
        ]
      );
    }, 200);
  };

  const handleReset = () => {
    Alert.alert(
      '⚠️ 전체 리셋',
      '모든 카운트가 0으로 초기화됩니다.\n정말 리셋할까요?',
      [
        { text: '취소', style: 'cancel' },
        { text: '리셋', style: 'destructive', onPress: () => { resetAll(); setLogs([]); } },
      ]
    );
  };

  const handleSelectItem = (id: string) => {
    setCurId(id);
  };

  // ─────────────────────────────────────────────
  // 렌더
  // ─────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>FISHLINE</Text>
        <Text style={styles.logoSub}>CATCH COUNTER</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* 항목 탭 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsWrap}>
          {items.map(item => (
            <TouchableOpacity key={item.id}
              style={[styles.tab, curId === item.id && styles.tabActive]}
              onPress={() => handleSelectItem(item.id)}
              onLongPress={() => handleLongPressItem(item.id)}>
              <Text style={[styles.tabText, curId === item.id && styles.tabTextActive]}>
                {item.name}
              </Text>
              {item.count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{item.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addTab} onPress={() => setShowAdd(true)}>
            <Text style={styles.addTabText}>＋</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 카운터 메인 */}
        <View style={styles.counterMain}>
          {items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>항목이 없어요</Text>
              <Text style={styles.emptyDesc}>
                ＋ 버튼을 눌러서 추가해주세요{'\n'}예: 홍길동 쭈꾸미, 철수 갑오징어
              </Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowAdd(true)}>
                <Text style={styles.emptyAddBtnText}>＋ 항목 추가</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.speciesLabel}>{curItem?.name.toUpperCase()}</Text>
              <Text style={styles.countNum}>{curItem?.count || 0}</Text>
              <Text style={styles.countUnit}>MARID</Text>
              <View style={styles.btnWrap}>
                <TouchableOpacity style={styles.minusBtn} onPress={handleMinus}>
                  <Text style={styles.minusBtnText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.plusBtn} onPress={handlePlus}>
                  <Text style={styles.plusBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* 전체 현황 */}
        {items.length > 0 && (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>TOTAL RECORD</Text>
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Text style={styles.resetBtnText}>⚠ 전체 리셋</Text>
              </TouchableOpacity>
            </View>
            {items.map(item => (
              <View key={item.id} style={styles.totalRow}>
                <Text style={styles.totalName}>{item.name}</Text>
                <View style={styles.totalRight}>
                  <Text style={styles.totalCount}>{item.count}</Text>
                  <Text style={styles.totalUnit}> 마리</Text>
                </View>
              </View>
            ))}
            <View style={styles.totalSumRow}>
              <Text style={styles.totalSumLabel}>합계</Text>
              <Text style={styles.totalSumVal}>
                {items.reduce((s, i) => s + i.count, 0)} 마리
              </Text>
            </View>
          </View>
        )}

        {/* 최근 기록 */}
        {logs.length > 0 && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>RECENT LOG</Text>
            {logs.map((l, i) => (
              <View key={i} style={styles.logItem}>
                <Text style={styles.logName}>{l.name}</Text>
                <Text style={styles.logTime}>{l.time}</Text>
                <Text style={styles.logCnt}>{l.count}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* 항목 추가 모달 */}
      <Modal visible={showAdd} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>항목 추가</Text>
            <Text style={styles.modalDesc}>예: 홍길동 쭈꾸미, 철수 갑오징어</Text>
            <TextInput
              style={styles.input}
              placeholder="이름 입력..."
              placeholderTextColor="#3a3020"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={handleAdd}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel}
                onPress={() => { setShowAdd(false); setNewName(''); }}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleAdd}>
                <Text style={styles.modalConfirmText}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ⭐ 길게누르기 액션 메뉴 모달 */}
      <Modal visible={showActionMenu} transparent animationType="fade"
        onRequestClose={() => setShowActionMenu(false)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}>
          <View style={styles.actionMenuBox}>
            <Text style={styles.actionMenuTitle}>
              "{items.find(i => i.id === actionTargetId)?.name}"
            </Text>
            <Text style={styles.actionMenuSub}>어떻게 할까요?</Text>

            <TouchableOpacity style={styles.actionMenuItem} onPress={handleActionRename}>
              <Text style={styles.actionMenuIcon}>✏️</Text>
              <Text style={styles.actionMenuText}>이름 변경</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionMenuItem} onPress={handleActionReset}>
              <Text style={styles.actionMenuIcon}>🔄</Text>
              <Text style={styles.actionMenuText}>카운트 리셋</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionMenuItem} onPress={handleActionDelete}>
              <Text style={styles.actionMenuIcon}>🗑️</Text>
              <Text style={[styles.actionMenuText, { color: '#e05555' }]}>삭제</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionMenuCancel} 
              onPress={() => setShowActionMenu(false)}>
              <Text style={styles.actionMenuCancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ⭐ 이름 변경 모달 */}
      <Modal visible={showRename} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>이름 변경</Text>
            <Text style={styles.modalDesc}>새로운 이름을 입력해주세요</Text>
            <TextInput
              style={styles.input}
              placeholder="새 이름..."
              placeholderTextColor="#3a3020"
              value={renameValue}
              onChangeText={setRenameValue}
              autoFocus
              onSubmitEditing={handleRenameConfirm}
              maxLength={20}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel}
                onPress={() => { setShowRename(false); setRenameValue(''); }}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleRenameConfirm}>
                <Text style={styles.modalConfirmText}>변경</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────
// 스타일 (원본 유지)
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#080808' },
  header:          { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)' },
  logo:            { fontSize: 22, fontWeight: '700', letterSpacing: 4, color: '#e8c96a' },
  logoSub:         { fontSize: 8, letterSpacing: 4, color: '#8a7a5a', marginTop: 2 },
  tabsWrap:        { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  tab:             { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)', borderRadius: 3, position: 'relative' },
  tabActive:       { backgroundColor: 'rgba(201,168,76,0.15)', borderColor: 'rgba(201,168,76,0.4)' },
  tabText:         { fontSize: 12, color: '#8a7a5a' },
  tabTextActive:   { color: '#e8c96a' },
  tabBadge:        { position: 'absolute', top: -6, right: -6, backgroundColor: '#c9a84c', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText:    { fontSize: 9, color: '#080808', fontWeight: '700' },
  addTab:          { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', borderRadius: 3, borderStyle: 'dashed', justifyContent: 'center' },
  addTabText:      { fontSize: 16, color: '#c9a84c' },
  counterMain:     { alignItems: 'center', paddingVertical: 24, minHeight: 200 },
  emptyWrap:       { alignItems: 'center', paddingVertical: 32 },
  emptyTitle:      { fontSize: 16, color: '#8a7a5a', fontWeight: '500', marginBottom: 8 },
  emptyDesc:       { fontSize: 12, color: '#3a3020', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyAddBtn:     { backgroundColor: '#c9a84c', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 4 },
  emptyAddBtnText: { color: '#080808', fontWeight: '700', fontSize: 13 },
  speciesLabel:    { fontSize: 10, letterSpacing: 4, color: '#8a7a5a', marginBottom: 4 },
  countNum:        { fontSize: 110, fontWeight: '700', color: '#e8c96a', lineHeight: 110, letterSpacing: -2 },
  countUnit:       { fontSize: 10, letterSpacing: 3, color: '#8a7a5a', marginBottom: 24 },
  btnWrap:         { flexDirection: 'row', gap: 20, alignItems: 'center' },
  minusBtn:        { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)', alignItems: 'center', justifyContent: 'center' },
  minusBtnText:    { color: '#8a7a5a', fontSize: 28 },
  plusBtn:         { width: 84, height: 84, borderRadius: 42, backgroundColor: '#c9a84c', alignItems: 'center', justifyContent: 'center' },
  plusBtnText:     { color: '#080808', fontSize: 40, fontWeight: '300' },
  panel:           { margin: 16, marginTop: 0, backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)', borderRadius: 4, padding: 16, marginBottom: 10 },
  panelHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  panelTitle:      { fontSize: 9, letterSpacing: 4, color: '#c9a84c', fontWeight: '500' },
  resetBtn:        { paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(224,85,85,0.4)', borderRadius: 3 },
  resetBtnText:    { fontSize: 10, color: '#e05555', letterSpacing: 1 },
  totalRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.08)' },
  totalName:       { fontSize: 13, color: '#f0ead8' },
  totalRight:      { flexDirection: 'row', alignItems: 'baseline' },
  totalCount:      { fontSize: 18, fontWeight: '700', color: '#e8c96a', letterSpacing: 1 },
  totalUnit:       { fontSize: 11, color: '#8a7a5a' },
  totalSumRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 4 },
  totalSumLabel:   { fontSize: 12, color: '#c9a84c', fontWeight: '500' },
  totalSumVal:     { fontSize: 16, fontWeight: '700', color: '#c9a84c' },
  logItem:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.08)' },
  logName:         { flex: 1, fontSize: 12, color: '#f0ead8' },
  logTime:         { fontSize: 10, color: '#3a3020', marginRight: 12 },
  logCnt:          { fontSize: 16, fontWeight: '700', color: '#e8c96a', letterSpacing: 1 },
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
  modalBox:        { backgroundColor: '#141414', borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)', borderRadius: 8, padding: 24, width: '82%' },
  modalTitle:      { fontSize: 14, fontWeight: '700', color: '#e8c96a', letterSpacing: 2, marginBottom: 4 },
  modalDesc:       { fontSize: 11, color: '#8a7a5a', marginBottom: 16, lineHeight: 18 },
  input:           { backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', borderRadius: 4, padding: 12, color: '#f0ead8', fontSize: 14, marginBottom: 16 },
  modalBtns:       { flexDirection: 'row', gap: 8 },
  modalCancel:     { flex: 1, padding: 12, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)', alignItems: 'center' },
  modalCancelText: { color: '#8a7a5a', fontSize: 13 },
  modalConfirm:    { flex: 1, padding: 12, borderRadius: 4, backgroundColor: '#c9a84c', alignItems: 'center' },
  modalConfirmText: { color: '#080808', fontWeight: '700', fontSize: 13 },
    // ⭐ 길게누르기 액션 메뉴
  actionMenuBox: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
    borderRadius: 12,
    padding: 20,
    width: '82%',
  },
  actionMenuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e8c96a',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionMenuSub: {
    fontSize: 12,
    color: '#8a7a5a',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.08)',
    gap: 12,
  },
  actionMenuIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  actionMenuText: {
    fontSize: 14,
    color: '#f0ead8',
    flex: 1,
  },
  actionMenuCancel: {
    marginTop: 12,
    padding: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    alignItems: 'center',
  },
  actionMenuCancelText: {
    fontSize: 13,
    color: '#8a7a5a',
    fontWeight: '500',
  },
});