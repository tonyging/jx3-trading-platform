// view/AppearanceTradeDetailView.vue
import { ref, onMounted, computed, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { appearanceTradeApi } from '@/services/api/appearanceTrade';
import { uploadImageToFirebase } from '@/firebase/storage';
// 獲取路由參數
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const tradeId = route.params.id;
// 反應式狀態
const trade = ref(null);
const loading = ref(true);
const error = ref(null);
const message = ref('');
const isSendingMessage = ref(false);
const cancelReason = ref('');
const showCancelModal = ref(false);
const isConfirming = ref(false);
const notification = ref({
    show: false,
    message: '',
    type: 'success',
});
// 訊息圖片相關的狀態
const messageImageFile = ref(null);
const messageImagePreview = ref(null);
const isUploadingMessageImage = ref(false);
// 計算屬性
const isSeller = computed(() => {
    if (!trade.value || !userStore.currentUser)
        return false;
    return typeof trade.value.sellerId === 'object'
        ? trade.value.sellerId._id === userStore.currentUser.id
        : trade.value.sellerId === userStore.currentUser.id;
});
const isBuyer = computed(() => {
    if (!trade.value || !userStore.currentUser || !trade.value.buyerId)
        return false;
    return typeof trade.value.buyerId === 'object'
        ? trade.value.buyerId._id === userStore.currentUser.id
        : trade.value.buyerId === userStore.currentUser.id;
});
const isTradeParticipant = computed(() => isSeller.value || isBuyer.value);
const canSendMessage = computed(() => {
    return (isTradeParticipant.value &&
        trade.value &&
        trade.value.status !== 'completed' &&
        trade.value.status !== 'cancelled' &&
        trade.value.status !== 'deleted');
});
const canConfirmTransaction = computed(() => {
    return (trade.value &&
        (trade.value.status === 'trading' || trade.value.status === 'pending_confirmation') &&
        ((isSeller.value && !trade.value.sellerConfirmed) ||
            (isBuyer.value && !trade.value.buyerConfirmed)));
});
const canCancelTransaction = computed(() => {
    return (isTradeParticipant.value &&
        trade.value &&
        (trade.value.status === 'trading' || trade.value.status === 'pending_confirmation'));
});
// 獲取發送者的名稱
const getSenderName = (sender) => {
    if (typeof sender === 'object' && sender !== null) {
        return sender.name || '未知用戶';
    }
    // 如果 sender 是 ID，嘗試在交易對象中查找
    if (trade.value) {
        // 檢查是否是賣家
        if (typeof trade.value.sellerId === 'object' &&
            trade.value.sellerId !== null &&
            trade.value.sellerId._id === sender) {
            return trade.value.sellerId.name || '賣家';
        }
        // 檢查是否是買家
        if (typeof trade.value.buyerId === 'object' &&
            trade.value.buyerId !== null &&
            trade.value.buyerId._id === sender) {
            return trade.value.buyerId.name || '買家';
        }
    }
    // 如果找不到匹配，使用角色名稱
    return isSeller.value && sender === userStore.currentUser?.id
        ? '我(賣家)'
        : isBuyer.value && sender === userStore.currentUser?.id
            ? '我(買家)'
            : '用戶';
};
// 獲取發送者頭像的首字母
const getSenderInitial = (sender) => {
    const name = getSenderName(sender);
    return name.charAt(0) || '?';
};
const statusText = computed(() => {
    if (!trade.value)
        return '';
    const statusMap = {
        pending: '待交易',
        trading: '交易中',
        pending_confirmation: '待確認',
        completed: '已完成',
        cancelled: '已取消',
        deleted: '已下架',
    };
    return statusMap[trade.value.status] || trade.value.status;
});
const statusClass = computed(() => {
    if (!trade.value)
        return '';
    const classMap = {
        pending: 'status-pending',
        trading: 'status-trading',
        pending_confirmation: 'status-pending-confirmation',
        completed: 'status-completed',
        cancelled: 'status-cancelled',
        deleted: 'status-deleted',
    };
    return classMap[trade.value.status] || '';
});
// 方法
async function fetchTradeDetails() {
    loading.value = true;
    error.value = null;
    try {
        const response = await appearanceTradeApi.getAppearanceTradeById(tradeId);
        trade.value = response.data.trade;
    }
    catch (err) {
        console.error('獲取交易詳情失敗:', err);
        const apiError = err;
        error.value =
            apiError.response?.data?.message || apiError.message || '無法載入交易詳情，請稍後再試。';
    }
    finally {
        loading.value = false;
    }
}
// 顯示通知的方法
const showNotification = (message, type = 'success') => {
    notification.value = {
        show: true,
        message,
        type,
    };
    // 3秒後自動關閉通知
    setTimeout(() => {
        notification.value.show = false;
    }, 3000);
};
async function sendMessage() {
    if (!message.value.trim() || isSendingMessage.value)
        return;
    isSendingMessage.value = true;
    try {
        const response = await appearanceTradeApi.sendMessage(tradeId, message.value);
        trade.value = response.data.trade;
        message.value = '';
        showNotification('訊息發送成功');
    }
    catch (err) {
        console.error('發送訊息失敗:', err);
        const apiError = err;
        showNotification(apiError.response?.data?.message || apiError.message || '訊息發送失敗，請稍後再試。', 'error');
    }
    finally {
        isSendingMessage.value = false;
    }
}
async function confirmTransaction() {
    if (isConfirming.value)
        return;
    isConfirming.value = true;
    try {
        const method = isSeller.value ? 'sellerConfirmTrade' : 'buyerConfirmTrade';
        const response = await appearanceTradeApi[method](tradeId);
        trade.value = response.data.trade;
        showNotification('交易確認成功');
    }
    catch (err) {
        console.error('確認交易失敗:', err);
        const apiError = err;
        showNotification(apiError.response?.data?.message || apiError.message || '無法確認交易，請稍後再試。', 'error');
    }
    finally {
        isConfirming.value = false;
    }
}
async function cancelTransaction() {
    try {
        const response = await appearanceTradeApi.cancelTrade(tradeId, cancelReason.value);
        trade.value = response.data.trade;
        showCancelModal.value = false;
        cancelReason.value = '';
        showNotification('交易已取消');
    }
    catch (err) {
        console.error('取消交易失敗:', err);
        const apiError = err;
        showNotification(apiError.response?.data?.message || apiError.message || '無法取消交易，請稍後再試。', 'error');
    }
}
// 生命週期鉤子
onMounted(() => {
    fetchTradeDetails();
});
// 定時刷新交易詳情
let refreshInterval = null;
onMounted(() => {
    fetchTradeDetails();
    // 每60秒自動刷新一次
    refreshInterval = window.setInterval(() => {
        if (trade.value && ['trading', 'pending_confirmation'].includes(trade.value.status)) {
            fetchTradeDetails();
        }
    }, 60000);
});
// 組件卸載時清除定時器
onUnmounted(() => {
    if (refreshInterval !== null) {
        clearInterval(refreshInterval);
    }
    // 清理預覽URL
    if (messageImagePreview.value) {
        URL.revokeObjectURL(messageImagePreview.value);
    }
});
// 格式化時間的輔助函數
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
}
// 監聽路由變化，重新獲取數據
watch(() => route.params.id, (newId) => {
    if (newId) {
        fetchTradeDetails();
    }
});
// 獲取外觀名稱
const getAppearanceName = computed(() => {
    if (!trade.value)
        return '未知外觀';
    if (typeof trade.value.appearanceId === 'object') {
        return trade.value.appearanceId.officialName || '未知外觀';
    }
    return '未知外觀';
});
// 獲取外觀類型
const getAppearanceCategory = computed(() => {
    if (!trade.value)
        return '未知類型';
    if (typeof trade.value.appearanceId === 'object' && trade.value.appearanceId.category) {
        return trade.value.appearanceId.category;
    }
    return '未知類型';
});
// 獲取外觀圖片
const getAppearanceImage = computed(() => {
    if (!trade.value)
        return null;
    if (typeof trade.value.appearanceId === 'object' && trade.value.appearanceId.imageUrl) {
        return trade.value.appearanceId.imageUrl;
    }
    return null;
});
// 交易確認狀態信息
const confirmationStatus = computed(() => {
    if (!trade.value)
        return { seller: false, buyer: false };
    return {
        seller: trade.value.sellerConfirmed,
        buyer: trade.value.buyerConfirmed,
    };
});
// 獲取賣家名稱和聯絡方式
const getSellerInfo = computed(() => {
    if (!trade.value)
        return { name: '未知賣家' };
    if (typeof trade.value.sellerId === 'object') {
        return {
            name: trade.value.sellerId.name || '未知賣家',
        };
    }
    return { name: '未知賣家' };
});
// 獲取買家名稱和聯絡方式
const getBuyerInfo = computed(() => {
    if (!trade.value || !trade.value.buyerId)
        return { name: '無買家' };
    if (typeof trade.value.buyerId === 'object') {
        return {
            name: trade.value.buyerId.name || '未知買家',
        };
    }
    return { name: '未知買家' };
});
// 處理訊息圖片選擇
function handleMessageImageSelect(event) {
    const target = event.target;
    if (target.files && target.files.length > 0) {
        messageImageFile.value = target.files[0];
        // 創建預覽URL
        if (messageImagePreview.value) {
            URL.revokeObjectURL(messageImagePreview.value);
        }
        messageImagePreview.value = URL.createObjectURL(messageImageFile.value);
    }
}
// 取消圖片選擇
function cancelMessageImage() {
    messageImageFile.value = null;
    if (messageImagePreview.value) {
        URL.revokeObjectURL(messageImagePreview.value);
        messageImagePreview.value = null;
    }
}
// 發送圖片訊息
async function sendImageMessage() {
    if (!messageImageFile.value || isUploadingMessageImage.value)
        return;
    isUploadingMessageImage.value = true;
    try {
        // 上傳圖片到Firebase
        const imagePath = `appearance-trades/${tradeId}/messages/${Date.now()}`;
        const imageUrl = await uploadImageToFirebase(messageImageFile.value, imagePath);
        // 將圖片URL作為特殊格式訊息發送
        // 例如: [image]圖片URL[/image]
        const imageMessage = `[image]${imageUrl}[/image]`;
        const response = await appearanceTradeApi.sendMessage(tradeId, imageMessage);
        trade.value = response.data.trade;
        // 清除圖片預覽和檔案
        cancelMessageImage();
        showNotification('圖片已發送');
    }
    catch (err) {
        console.error('發送圖片訊息失敗:', err);
        const apiError = err;
        showNotification(apiError.response?.data?.message || apiError.message || '圖片發送失敗，請稍後再試。', 'error');
    }
    finally {
        isUploadingMessageImage.value = false;
    }
}
// 判斷訊息是否為圖片訊息的輔助函數
function isImageMessage(content) {
    return content.startsWith('[image]') && content.endsWith('[/image]');
}
// 從圖片訊息中提取圖片URL
function extractImageUrl(content) {
    return content.replace('[image]', '').replace('[/image]', '');
}
// 檢查訊息並釋放資源
onUnmounted(() => {
    if (refreshInterval !== null) {
        clearInterval(refreshInterval);
    }
    if (messageImagePreview.value) {
        URL.revokeObjectURL(messageImagePreview.value);
    }
}); /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['status-icon', 'status-label', 'page-title-section', 'header-actions-container', 'confirmation-status-inline', 'header-actions', 'header-action-button', 'confirmed', 'status-icon', 'confirm-button', 'cancel-button', 'confirm-button', 'cancel-button', 'message-content', 'message-avatar', 'message-content', 'message-header', 'with-preview', 'appearance-card', 'appearance-info', 'appearance-image-container', 'appearance-image', 'trade-content-area', 'message-input-container', 'message-text-input', 'message-controls', 'message-tip', 'trade-details-card', 'detail-content', 'trade-actions-section', 'trade-actions', 'action-item', 'action-info', 'confirm-button', 'cancel-button', 'appearance-card', 'appearance-info', 'appearance-image-container', 'appearance-image', 'page-title-section', 'header-actions-container', 'confirmation-status-inline', 'header-actions', 'header-action-button', 'message-input-container', 'message-text-input', 'message-controls', 'message-actions',];
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("appearance-trade-detail") },
    });
    if (__VLS_ctx.loading) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("loading-container") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("loading-spinner") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    }
    else if (__VLS_ctx.error) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("error-container") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.error);
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.fetchTradeDetails) },
            ...{ class: ("primary-button") },
        });
    }
    else if (__VLS_ctx.trade) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("trade-container") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("page-header") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!((__VLS_ctx.loading))))
                        return;
                    if (!(!((__VLS_ctx.error))))
                        return;
                    if (!((__VLS_ctx.trade)))
                        return;
                    __VLS_ctx.router.go(-1);
                } },
            ...{ class: ("back-button") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("page-title-section") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("title-status-container") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
            ...{ class: ("page-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("trade-status") },
            ...{ class: ((__VLS_ctx.statusClass)) },
        });
        (__VLS_ctx.statusText);
        if (__VLS_ctx.canConfirmTransaction || __VLS_ctx.canCancelTransaction) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("header-actions-container") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("confirmation-status-inline") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("confirmation-label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("status-indicator") },
                ...{ class: (({ confirmed: __VLS_ctx.confirmationStatus.seller })) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("status-icon") },
            });
            (__VLS_ctx.confirmationStatus.seller ? '✓' : '○');
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("status-label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("status-indicator") },
                ...{ class: (({ confirmed: __VLS_ctx.confirmationStatus.buyer })) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("status-icon") },
            });
            (__VLS_ctx.confirmationStatus.buyer ? '✓' : '○');
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("status-label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("header-actions") },
            });
            if (__VLS_ctx.canConfirmTransaction) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.confirmTransaction) },
                    ...{ class: ("header-action-button confirm-button") },
                    disabled: ((__VLS_ctx.isConfirming)),
                });
                if (!__VLS_ctx.isConfirming) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    (__VLS_ctx.isSeller ? '賣家確認交易' : '買家確認交易');
                }
                else {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                }
            }
            if (__VLS_ctx.canCancelTransaction) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.loading))))
                                return;
                            if (!(!((__VLS_ctx.error))))
                                return;
                            if (!((__VLS_ctx.trade)))
                                return;
                            if (!((__VLS_ctx.canConfirmTransaction || __VLS_ctx.canCancelTransaction)))
                                return;
                            if (!((__VLS_ctx.canCancelTransaction)))
                                return;
                            __VLS_ctx.showCancelModal = true;
                        } },
                    ...{ class: ("header-action-button cancel-button") },
                });
            }
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("trade-content-area") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("trade-left-column") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("info-card appearance-card") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            ...{ class: ("card-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("appearance-info") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("appearance-image-container") },
        });
        if (__VLS_ctx.getAppearanceImage) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("appearance-image") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                src: ((__VLS_ctx.getAppearanceImage)),
                alt: ((__VLS_ctx.getAppearanceName)),
            });
        }
        else {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("appearance-image appearance-placeholder") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("appearance-details") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: ("appearance-name") },
        });
        (__VLS_ctx.getAppearanceName);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("appearance-category") },
        });
        (__VLS_ctx.getAppearanceCategory);
        if (typeof __VLS_ctx.trade.appearanceId === 'object' &&
            __VLS_ctx.trade.appearanceId.nicknames &&
            __VLS_ctx.trade.appearanceId.nicknames.length > 0) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("appearance-nicknames") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.trade.appearanceId.nicknames.join('、'));
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("info-card trade-details-card") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            ...{ class: ("card-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("detail-content") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("detail-row") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("detail-item") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("detail-label") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("detail-value price") },
        });
        (__VLS_ctx.trade.price);
        (__VLS_ctx.trade.currency);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("detail-item") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("detail-label") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("detail-value") },
        });
        (__VLS_ctx.trade.selectedPaymentMethod || __VLS_ctx.trade.paymentMethods.join('、'));
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("detail-row") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("detail-item") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("detail-label") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("detail-value") },
        });
        (__VLS_ctx.getSellerInfo.name);
        if (__VLS_ctx.trade.buyerId) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("detail-item") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("detail-label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("detail-value") },
            });
            (__VLS_ctx.getBuyerInfo.name);
        }
        if (__VLS_ctx.trade.paymentProof) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("payment-proof-section") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                ...{ class: ("section-title") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("payment-proof") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("payment-proof-image") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                src: ((__VLS_ctx.trade.paymentProof.imageUrl)),
                alt: ("付款證明"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("payment-proof-info") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("upload-time") },
            });
            (__VLS_ctx.formatDate(__VLS_ctx.trade.paymentProof.uploadTime));
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("trade-right-column") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("messages-container") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            ...{ class: ("messages-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("security-notice") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("notice-icon") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("notice-text") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("messages-box") },
        });
        if (__VLS_ctx.trade.messages && __VLS_ctx.trade.messages.length > 0) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("messages-list") },
            });
            for (const [msg, index] of __VLS_getVForSourceType((__VLS_ctx.trade.messages))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: ((index)),
                    ...{ class: ("message-item") },
                    ...{ class: (({
                            'my-message': (typeof msg.sender === 'object' ? msg.sender._id : msg.sender) ===
                                __VLS_ctx.userStore.currentUser?.id,
                            'other-message': (typeof msg.sender === 'object' ? msg.sender._id : msg.sender) !==
                                __VLS_ctx.userStore.currentUser?.id,
                        })) },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("message-avatar") },
                });
                (__VLS_ctx.getSenderInitial(msg.sender));
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("message-content") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("message-header") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ("message-sender") },
                });
                (__VLS_ctx.getSenderName(msg.sender));
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ("message-time") },
                });
                (__VLS_ctx.formatDate(msg.timestamp));
                if (__VLS_ctx.isImageMessage(msg.content)) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("message-image") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                        src: ((__VLS_ctx.extractImageUrl(msg.content))),
                        alt: ("圖片訊息"),
                    });
                }
                else {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("message-text") },
                    });
                    (msg.content);
                }
            }
        }
        else {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("no-messages") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        }
        if (__VLS_ctx.canSendMessage) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("message-input-container") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("message-input-wrapper") },
            });
            if (__VLS_ctx.messageImagePreview) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("message-image-preview") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                    src: ((__VLS_ctx.messageImagePreview)),
                    alt: ("圖片預覽"),
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.cancelMessageImage) },
                    ...{ class: ("cancel-image-button") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.sendImageMessage) },
                    ...{ class: ("send-image-button") },
                    disabled: ((__VLS_ctx.isUploadingMessageImage)),
                });
                (__VLS_ctx.isUploadingMessageImage ? '發送中...' : '發送圖片');
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("message-text-input") },
                ...{ class: (({ 'with-preview': __VLS_ctx.messageImagePreview })) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
                ...{ onKeyup: (__VLS_ctx.sendMessage) },
                value: ((__VLS_ctx.message)),
                placeholder: ("輸入訊息..."),
                ...{ class: ("message-input") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("message-controls") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("message-tip") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("message-actions") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: ("upload-image-button") },
                title: ("上傳圖片"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                ...{ onChange: (__VLS_ctx.handleMessageImageSelect) },
                type: ("file"),
                accept: ("image/*"),
                ...{ class: ("file-input") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                xmlns: ("http://www.w3.org/2000/svg"),
                width: ("16"),
                height: ("16"),
                viewBox: ("0 0 24 24"),
                fill: ("none"),
                stroke: ("currentColor"),
                'stroke-width': ("2"),
                'stroke-linecap': ("round"),
                'stroke-linejoin': ("round"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.rect, __VLS_intrinsicElements.rect)({
                x: ("3"),
                y: ("3"),
                width: ("18"),
                height: ("18"),
                rx: ("2"),
                ry: ("2"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)({
                cx: ("8.5"),
                cy: ("8.5"),
                r: ("1.5"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.polyline, __VLS_intrinsicElements.polyline)({
                points: ("21 15 16 10 5 21"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.sendMessage) },
                ...{ class: ("send-button") },
                disabled: ((!__VLS_ctx.message.trim() || __VLS_ctx.isSendingMessage)),
            });
            (__VLS_ctx.isSendingMessage ? '發送中...' : '發送');
        }
    }
    if (__VLS_ctx.showCancelModal) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("modal-overlay") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: () => { } },
            ...{ class: ("modal-content") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: ("modal-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: ("modal-description") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
            value: ((__VLS_ctx.cancelReason)),
            placeholder: ("請輸入取消原因..."),
            rows: ("4"),
            ...{ class: ("modal-textarea") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("modal-actions") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.showCancelModal)))
                        return;
                    __VLS_ctx.showCancelModal = false;
                } },
            ...{ class: ("secondary-button") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.cancelTransaction) },
            ...{ class: ("danger-button") },
            disabled: ((!__VLS_ctx.cancelReason.trim())),
        });
    }
    if (__VLS_ctx.notification.show) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ((['notification', `notification-${__VLS_ctx.notification.type}`])) },
        });
        (__VLS_ctx.notification.message);
    }
    ['appearance-trade-detail', 'loading-container', 'loading-spinner', 'error-container', 'primary-button', 'trade-container', 'page-header', 'back-button', 'page-title-section', 'title-status-container', 'page-title', 'trade-status', 'header-actions-container', 'confirmation-status-inline', 'confirmation-label', 'status-indicator', 'confirmed', 'status-icon', 'status-label', 'status-indicator', 'confirmed', 'status-icon', 'status-label', 'header-actions', 'header-action-button', 'confirm-button', 'header-action-button', 'cancel-button', 'trade-content-area', 'trade-left-column', 'info-card', 'appearance-card', 'card-title', 'appearance-info', 'appearance-image-container', 'appearance-image', 'appearance-image', 'appearance-placeholder', 'appearance-details', 'appearance-name', 'appearance-category', 'appearance-nicknames', 'info-card', 'trade-details-card', 'card-title', 'detail-content', 'detail-row', 'detail-item', 'detail-label', 'detail-value', 'price', 'detail-item', 'detail-label', 'detail-value', 'detail-row', 'detail-item', 'detail-label', 'detail-value', 'detail-item', 'detail-label', 'detail-value', 'payment-proof-section', 'section-title', 'payment-proof', 'payment-proof-image', 'payment-proof-info', 'upload-time', 'trade-right-column', 'messages-container', 'messages-title', 'security-notice', 'notice-icon', 'notice-text', 'messages-box', 'messages-list', 'message-item', 'my-message', 'other-message', 'message-avatar', 'message-content', 'message-header', 'message-sender', 'message-time', 'message-image', 'message-text', 'no-messages', 'message-input-container', 'message-input-wrapper', 'message-image-preview', 'cancel-image-button', 'send-image-button', 'message-text-input', 'with-preview', 'message-input', 'message-controls', 'message-tip', 'message-actions', 'upload-image-button', 'file-input', 'send-button', 'modal-overlay', 'modal-content', 'modal-title', 'modal-description', 'modal-textarea', 'modal-actions', 'secondary-button', 'danger-button', 'notification',];
    var __VLS_slots;
    var $slots;
    let __VLS_inheritedAttrs;
    var $attrs;
    const __VLS_refs = {};
    var $refs;
    var $el;
    return {
        attrs: {},
        slots: __VLS_slots,
        refs: $refs,
        rootEl: $el,
    };
}
;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            userStore: userStore,
            trade: trade,
            loading: loading,
            error: error,
            message: message,
            isSendingMessage: isSendingMessage,
            cancelReason: cancelReason,
            showCancelModal: showCancelModal,
            isConfirming: isConfirming,
            notification: notification,
            messageImagePreview: messageImagePreview,
            isUploadingMessageImage: isUploadingMessageImage,
            isSeller: isSeller,
            canSendMessage: canSendMessage,
            canConfirmTransaction: canConfirmTransaction,
            canCancelTransaction: canCancelTransaction,
            getSenderName: getSenderName,
            getSenderInitial: getSenderInitial,
            statusText: statusText,
            statusClass: statusClass,
            fetchTradeDetails: fetchTradeDetails,
            sendMessage: sendMessage,
            confirmTransaction: confirmTransaction,
            cancelTransaction: cancelTransaction,
            formatDate: formatDate,
            getAppearanceName: getAppearanceName,
            getAppearanceCategory: getAppearanceCategory,
            getAppearanceImage: getAppearanceImage,
            confirmationStatus: confirmationStatus,
            getSellerInfo: getSellerInfo,
            getBuyerInfo: getBuyerInfo,
            handleMessageImageSelect: handleMessageImageSelect,
            cancelMessageImage: cancelMessageImage,
            sendImageMessage: sendImageMessage,
            isImageMessage: isImageMessage,
            extractImageUrl: extractImageUrl,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=AppearanceTradeDetailView.vue.js.map