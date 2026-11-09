'use client';

import React from 'react';
import { useAdminState } from '../../features/task-10-quan-tri/hooks/useTrangThaiQuanTri';
import { AdminStyles } from '../../features/task-10-quan-tri/thanh-phan/GiaoDienQuanTri';
import { AdminAuthChecking } from '../../features/task-10-quan-tri/thanh-phan/DangKiemTraQuyenQuanTri';
import { AdminLoginCard } from '../../features/task-10-quan-tri/thanh-phan/TheDangNhapQuanTri';
import { AdminCustomerBlocked } from '../../features/task-10-quan-tri/thanh-phan/ChanKhachHangQuanTri';
import { AdminSidebar } from '../../features/task-10-quan-tri/thanh-phan/ThanhBenQuanTri';
import { AdminHeader } from '../../features/task-10-quan-tri/thanh-phan/DauTrangQuanTri';
import { AccessDeniedCard } from '../../features/task-10-quan-tri/thanh-phan/TheTuChoiTruyCap';

// Tabs
import { OrdersTab } from '../../features/task-10-quan-tri/cac-tab/TabDonHang';
import { ProductsTab } from '../../features/task-10-quan-tri/cac-tab/TabSanPham';
import { InventoryTab } from '../../features/task-10-quan-tri/cac-tab/TabKhoHang';
import { PromotionsTab } from '../../features/task-10-quan-tri/cac-tab/TabKhuyenMai';
import { CustomersTab } from '../../features/task-10-quan-tri/cac-tab/TabKhachHang';
import { PermissionsTab } from '../../features/task-10-quan-tri/cac-tab/TabPhanQuyen';

// Modals
import { RolePermissionsModal } from '../../features/task-10-quan-tri/hop-thoai/HopThoaiPhanQuyenVaiTro';
import { ProductFormModal } from '../../features/task-10-quan-tri/hop-thoai/HopThoaiSanPham';
import { PromotionFormModal } from '../../features/task-10-quan-tri/hop-thoai/HopThoaiTaoKhuyenMai';
import { UserFormModal } from '../../features/task-10-quan-tri/hop-thoai/HopThoaiTaoTaiKhoan';
import { CustomerFormModal } from '../../features/task-10-quan-tri/hop-thoai/HopThoaiThemKhachHang';

export default function AdminPage() {
  const admin = useAdminState();
  React.useEffect(() => {
    if (admin.activeTab === 'Tài khoản & Phân quyền') {
      void admin.reloadUsers();
    }
  }, [admin.activeTab, admin.reloadUsers]);

  if (admin.authChecking) {
    return <AdminAuthChecking />;
  }

  if (admin.isNotLoggedIn) {
    return (
      <AdminLoginCard
        adminEmailInput={admin.adminEmailInput}
        setAdminEmailInput={admin.setAdminEmailInput}
        adminPasswordInput={admin.adminPasswordInput}
        setAdminPasswordInput={admin.setAdminPasswordInput}
        adminLoginError={admin.adminLoginError}
        adminLoginLoading={admin.adminLoginLoading}
        handleAdminLogin={admin.handleAdminLogin}
      />
    );
  }

  if (admin.isCustomerBlocked) {
    return (
      <AdminCustomerBlocked
        currentUserEmail={admin.currentUserEmail}
        onLogout={admin.handleAdminLogout}
      />
    );
  }

  const isTabAllowed = admin
    .getAllowedTabsForRole(admin.currentAdminRole)
    .includes(admin.activeTab);

  return (
    <div className="admin-container">
      <AdminStyles />

      <AdminSidebar
        activeTab={admin.activeTab}
        setActiveTab={admin.setActiveTab}
        currentAdminRole={admin.currentAdminRole}
        getAllowedTabsForRole={admin.getAllowedTabsForRole}
      />

      <main className="admin-main">
        <AdminHeader
          searchGlobal={admin.globalSearch}
          setSearchGlobal={admin.setGlobalSearch}
          currentAdminRole={admin.currentAdminRole}
          currentUserEmail={admin.currentUserEmail}
          handleAdminLogout={admin.handleAdminLogout}
        />

        <div className="admin-content-body">
          {!isTabAllowed ? (
            <AccessDeniedCard
              currentAdminRole={admin.currentAdminRole}
              activeTab={admin.activeTab}
              onFallbackTab={(tab) => admin.setActiveTab(tab)}
              fallbackTab={
                admin.getAllowedTabsForRole(admin.currentAdminRole)[0] || 'Đơn hàng'
              }
            />
          ) : (
            <>
              {admin.activeTab === 'Đơn hàng' && (
                <OrdersTab
                  orders={admin.orders}
                  currentAdminRole={admin.currentAdminRole}
                  orderStatusFilter={admin.orderStatusFilter}
                  setOrderStatusFilter={admin.setOrderStatusFilter}
                  handleUpdateOrderStatus={admin.handleUpdateOrderStatus}
                />
              )}

              {admin.activeTab === 'Sản phẩm' && (
                <ProductsTab
                  products={admin.productPageItems}
                  productTotal={admin.productTotal}
                  productPage={admin.productPage}
                  productPageSize={admin.productPageSize}
                  productTotalPages={admin.productTotalPages}
                  productLoading={admin.productLoading}
                  productError={admin.productError}
                  onPageChange={admin.setProductPage}
                  onReload={() => admin.reloadProductPage()}
                  productSearch={admin.productSearch}
                  setProductSearch={admin.setProductSearch}
                  productCategoryFilter={admin.productCategoryFilter}
                  setProductCategoryFilter={admin.setProductCategoryFilter}
                  productStatusFilter={admin.productStatusFilter}
                  setProductStatusFilter={admin.setProductStatusFilter}
                  onOpenAddModal={() => admin.setShowAddProductModal(true)}
                  openEditProductModal={admin.openEditProductModal}
                  toggleProductActive={admin.toggleProductActive}
                  deleteProduct={admin.deleteProduct}
                  triggerToast={admin.triggerToast}
                  onPrevPage={() => admin.setProductPage((p: number) => Math.max(1, p - 1))}
                  onNextPage={() => admin.setProductPage((p: number) => p + 1)}
                />
              )}

              {admin.activeTab === 'Kho hàng' && <InventoryTab triggerToast={admin.triggerToast} />}

              {admin.activeTab === 'Khuyến mãi' && (
                <PromotionsTab
                  promotions={admin.promotions}
                  promoSearch={admin.promoSearch}
                  setPromoSearch={admin.setPromoSearch}
                  promoStatusFilter={admin.promoStatusFilter}
                  setPromoStatusFilter={admin.setPromoStatusFilter}
                  onOpenAddModal={() => admin.setShowAddPromoModal(true)}
                  togglePromotionStatus={admin.togglePromotionStatus}
                  deletePromotion={admin.deletePromotion}
                  storeSettings={admin.storeSettings}
                  setStoreSettings={admin.setStoreSettings}
                  handleSaveSettings={admin.handleSaveSettings}
                  settingsSaving={admin.settingsSaving}
                />
              )}

              {admin.activeTab === 'Khách hàng' && (
                <CustomersTab
                  customers={admin.customers}
                  customerSearch={admin.customerSearch}
                  setCustomerSearch={admin.setCustomerSearch}
                  customerTierFilter={admin.customerTierFilter}
                  setCustomerTierFilter={admin.setCustomerTierFilter}
                  filteredCustomers={admin.filteredCustomers}
                  changeCustomerStatus={admin.changeCustomerStatus}
                  deleteCustomer={admin.deleteCustomer}
                  onOpenAddCustomer={() => {
                    admin.setShowAddCustomerModal(true);
                    admin.setCustEmailError('');
                    admin.setCustPhoneError('');
                  }}
                />
              )}

              {admin.activeTab === 'Tài khoản & Phân quyền' && (
                <PermissionsTab
                  users={admin.users}
                  userSearch={admin.userSearch}
                  setUserSearch={admin.setUserSearch}
                  userRoleFilter={admin.userRoleFilter}
                  setUserRoleFilter={admin.setUserRoleFilter}
                  userStatusFilter={admin.userStatusFilter}
                  setUserStatusFilter={admin.setUserStatusFilter}
                  usersLoading={admin.usersLoading}
                  usersError={admin.usersError}
                  onReloadUsers={admin.reloadUsers}
                  onOpenRoleModal={(role) => {
                    admin.handleRoleChangeInModal(role);
                    admin.setShowRoleModal(true);
                  }}
                  onOpenAddUserModal={() => admin.setShowAddUserModal(true)}
                  deleteUser={admin.deleteUser}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      <RolePermissionsModal
        showRoleModal={admin.showRoleModal}
        setShowRoleModal={admin.setShowRoleModal}
        activePermissions={admin.activePermissions}
        togglePermission={admin.togglePermission}
        selectedRoleForPerms={admin.selectedRoleForPerms}
        handleRoleChangeInModal={admin.handleRoleChangeInModal}
        handleSavePermissions={admin.handleSavePermissions}
      />

      <ProductFormModal
        showAddModal={admin.showAddProductModal}
        setShowAddModal={admin.setShowAddProductModal}
        newProdName={admin.newProdName}
        setNewProdName={admin.setNewProdName}
        newProdCategory={admin.newProdCategory}
        setNewProdCategory={admin.setNewProdCategory}
        newProdPrice={admin.newProdPrice}
        setNewProdPrice={admin.setNewProdPrice}
        newProdStock={admin.newProdStock}
        setNewProdStock={admin.setNewProdStock}
        newProdDescription={admin.newProdDescription}
        setNewProdDescription={admin.setNewProdDescription}
        newProdImageUrl={admin.newProdImageUrl}
        setNewProdImageUrl={admin.setNewProdImageUrl}
        newProdRecipeLines={admin.newProdRecipeLines}
        setNewProdRecipeLines={admin.setNewProdRecipeLines}
        newProdToppingIds={admin.newProdToppingIds}
        setNewProdToppingIds={admin.setNewProdToppingIds}
        isSavingProduct={admin.isSavingProduct}
        handleAddProduct={admin.handleAddProduct}
        editingProduct={admin.editingProduct}
        setEditingProduct={admin.setEditingProduct}
        editProdName={admin.editProdName}
        setEditProdName={admin.setEditProdName}
        editProdCategory={admin.editProdCategory}
        setEditProdCategory={admin.setEditProdCategory}
        editProdPrice={admin.editProdPrice}
        setEditProdPrice={admin.setEditProdPrice}
        editProdStock={admin.editProdStock}
        setEditProdStock={admin.setEditProdStock}
        editProdDescription={admin.editProdDescription}
        setEditProdDescription={admin.setEditProdDescription}
        editProdImageUrl={admin.editProdImageUrl}
        setEditProdImageUrl={admin.setEditProdImageUrl}
        editProdToppingIds={admin.editProdToppingIds}
        setEditProdToppingIds={admin.setEditProdToppingIds}
        handleSaveEditProduct={admin.handleSaveEditProduct}
        triggerToast={admin.triggerToast}
      />

      <PromotionFormModal
        showAddPromoModal={admin.showAddPromoModal}
        setShowAddPromoModal={admin.setShowAddPromoModal}
        newPromoCode={admin.newPromoCode}
        setNewPromoCode={admin.setNewPromoCode}
        newPromoName={admin.newPromoName}
        setNewPromoName={admin.setNewPromoName}
        newPromoDiscount={admin.newPromoDiscount}
        setNewPromoDiscount={admin.setNewPromoDiscount}
        newPromoTime={admin.newPromoTime}
        setNewPromoTime={admin.setNewPromoTime}
        handleAddPromo={admin.handleAddPromo}
      />

      <UserFormModal
        showAddUserModal={admin.showAddUserModal}
        setShowAddUserModal={admin.setShowAddUserModal}
        newUserEmail={admin.newUserEmail}
        setNewUserEmail={admin.setNewUserEmail}
        addUserError={admin.addUserError}
        setAddUserError={admin.setAddUserError}
        newUserRole={admin.newUserRole}
        setNewUserRole={admin.setNewUserRole}
        newUserPassword={admin.newUserPassword}
        setNewUserPassword={admin.setNewUserPassword}
        confirmNewUserPassword={admin.confirmNewUserPassword}
        setConfirmNewUserPassword={admin.setConfirmNewUserPassword}
        isCreatingUser={admin.isCreatingUser}
        handleAddUser={admin.handleAddUser}
      />

      <CustomerFormModal
        showAddCustomerModal={admin.showAddCustomerModal}
        setShowAddCustomerModal={admin.setShowAddCustomerModal}
        newCustName={admin.newCustName}
        setNewCustName={admin.setNewCustName}
        newCustPhone={admin.newCustPhone}
        setNewCustPhone={admin.setNewCustPhone}
        custPhoneError={admin.custPhoneError}
        setCustPhoneError={admin.setCustPhoneError}
        newCustEmail={admin.newCustEmail}
        setNewCustEmail={admin.setNewCustEmail}
        custEmailError={admin.custEmailError}
        setCustEmailError={admin.setCustEmailError}
        newCustTier={admin.newCustTier}
        setNewCustTier={admin.setNewCustTier}
        handleAddCustomer={admin.handleAddCustomer}
      />
    </div>
  );
}
