'use client';

import React from 'react';

export function AdminStyles() {
  return (
    <style jsx global>{`
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f8fafc;
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #1e293b;
      }

      .admin-container {
        display: flex;
        min-height: 100vh;
        background: #f8fafc;
      }

      /* 1. SIDEBAR */
      .admin-sidebar {
        width: 220px;
        background: #10352b;
        color: #ffffff;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        min-height: 100vh;
      }

      .sidebar-brand {
        padding: 24px 20px 20px;
      }

      .brand-logo-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .brand-icon {
        font-size: 20px;
      }

      .brand-name {
        font-size: 19px;
        font-weight: 800;
        letter-spacing: -0.3px;
      }

      .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding: 0 10px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border-radius: 99px;
        color: #d1fae5;
        font-size: 13px;
        font-weight: 500;
        background: transparent;
        border: 0;
        cursor: pointer;
        transition: all 0.15s;
        text-align: left;
      }

      .nav-item:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
      }

      .nav-item.active {
        background: #1c4a3d;
        color: #ffffff;
        font-weight: 700;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }

      /* 2. MAIN & TOPBAR */
      .admin-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .admin-topbar {
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        height: 60px;
        padding: 0 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
        z-index: 20;
      }

      .topbar-search {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 99px;
        padding: 6px 14px;
        width: 260px;
        color: #64748b;
      }

      .topbar-search input {
        border: 0;
        outline: 0;
        background: transparent;
        font-size: 12px;
        width: 100%;
      }

      .topbar-user {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        position: relative;
        user-select: none;
      }

      .user-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        object-fit: cover;
      }

      .user-info {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .user-email {
        font-size: 12px;
        font-weight: 700;
        color: #1e293b;
      }

      .user-role {
        font-size: 11px;
        color: #64748b;
      }

      .user-chevron {
        color: #64748b;
      }

      .user-dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
        width: 190px;
        padding: 6px;
        z-index: 30;
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 9px 12px;
        border-radius: 8px;
        font-size: 12px;
        color: #1e293b;
        text-decoration: none;
        background: transparent;
        border: 0;
        width: 100%;
        cursor: pointer;
      }

      .dropdown-item:hover {
        background: #f1f5f9;
      }

      .dropdown-item.danger {
        color: #dc2626;
      }

      /* CONTENT BODY */
      .admin-content-body {
        padding: 24px;
        flex: 1;
      }

      .page-heading {
        font-size: 22px;
        font-weight: 800;
        margin: 0 0 20px;
        color: #0f172a;
        letter-spacing: -0.4px;
      }

      .page-head-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }

      .page-head-row .page-heading {
        margin-bottom: 0;
      }

      .btn-primary-action {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #10352b;
        color: white;
        border: 0;
        border-radius: 8px;
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s;
      }

      .btn-primary-action:hover {
        background: #0d2a22;
      }

      .btn-secondary-action {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #ffffff;
        color: #10352b;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s;
      }

      .btn-secondary-action:hover {
        background: #f8fafc;
      }

      /* STAT CARDS */
      .stat-cards-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .stat-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 18px 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      }

      .stat-label {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 22px;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 8px;
        letter-spacing: -0.3px;
      }

      .stat-value.danger {
        color: #dc2626;
      }

      .stat-sub {
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .stat-sub.positive {
        color: #16a34a;
      }

      .stat-sub.danger {
        color: #dc2626;
        font-weight: 600;
      }

      /* OVERVIEW PANELS */
      .overview-panels-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
      }

      .chart-panel, .top-products-panel {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      }

      .panel-title {
        font-size: 14px;
        font-weight: 700;
        margin: 0 0 16px;
        color: #0f172a;
      }

      .revenue-svg {
        width: 100%;
        height: auto;
        overflow: visible;
      }

      .chart-label {
        font-size: 10px;
        fill: #94a3b8;
        font-family: inherit;
      }

      .top-products-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .top-prod-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
      }

      .top-prod-img {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        object-fit: cover;
      }

      .top-prod-name {
        flex: 1;
        color: #1e293b;
        font-weight: 600;
      }

      .top-prod-count {
        color: #0f172a;
        font-weight: 700;
      }

      /* FILTER BAR */
      .table-filter-bar {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        align-items: center;
      }

      .filter-search-box {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 7px 12px;
        font-size: 12px;
        width: 240px;
        color: #64748b;
      }

      .filter-search-box input {
        border: 0;
        outline: 0;
        width: 100%;
        font-size: 12px;
        background: transparent;
      }

      .filter-select-wrap select {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 7px 12px;
        font-size: 12px;
        color: #334155;
        cursor: pointer;
        outline: 0;
      }

      /* TABLES */
      .admin-table-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      }

      .admin-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        text-align: left;
      }

      .admin-table th {
        background: #f8fafc;
        color: #64748b;
        font-weight: 600;
        padding: 12px 18px;
        border-bottom: 1px solid #e2e8f0;
      }

      .admin-table td {
        padding: 12px 18px;
        border-bottom: 1px solid #f1f5f9;
        color: #1e293b;
        vertical-align: middle;
      }

      .admin-table tr:last-child td {
        border-bottom: 0;
      }

      .table-thumb {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        object-fit: cover;
      }

      .product-image-preview {
        display: block;
        width: 112px;
        height: 84px;
        margin-top: 8px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        object-fit: cover;
      }

      .product-image-preview-message {
        margin: 6px 0 0;
        font-size: 12px;
        color: #64748b;
      }

      .product-image-preview-message.error {
        color: #b91c1c;
      }

      .product-table-scroll {
        width: 100%;
        overflow-x: auto;
      }

      .product-table-scroll .admin-table {
        min-width: 780px;
      }

      .product-table-name {
        max-width: 220px;
        overflow-wrap: anywhere;
      }

      .product-pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        border-top: 1px solid #e2e8f0;
        font-size: 12px;
        color: #475569;
      }

      .product-pagination-actions {
        display: flex;
        gap: 8px;
      }

      .status-pill {
        display: inline-block;
        font-size: 10px;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 99px;
      }

      .status-pill.active {
        background: #dcfce7;
        color: #15803d;
      }

      .status-pill.warning {
        background: #fef3c7;
        color: #b45309;
      }

      .status-pill.inactive {
        background: #f1f5f9;
        color: #64748b;
      }

      .role-tag {
        font-size: 11px;
        color: #334155;
        font-weight: 600;
      }

      .action-icon-btn {
        border: 0;
        background: transparent;
        cursor: pointer;
        padding: 5px;
        border-radius: 6px;
        margin-left: 4px;
        transition: background 0.15s;
      }

      .action-icon-btn.edit {
        color: #64748b;
      }

      .action-icon-btn.edit:hover {
        background: #f1f5f9;
        color: #0f172a;
      }

      .action-icon-btn.delete {
        color: #ef4444;
      }

      .action-icon-btn.delete:hover {
        background: #fee2e2;
      }

      /* MODALS */
      .admin-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 50;
      }

      .admin-modal-card {
        background: #ffffff;
        border-radius: 16px;
        padding: 24px;
        width: 100%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        position: relative;
      }

      .modal-close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        border: 0;
        background: transparent;
        color: #94a3b8;
        cursor: pointer;
      }

      .modal-title {
        font-size: 16px;
        font-weight: 800;
        margin: 0;
        color: #0f172a;
      }

      .field-label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: #475569;
        margin-bottom: 5px;
      }

      .modal-input {
        width: 100%;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 12px;
        outline: 0;
      }

      /* PERMISSIONS MODAL */
      .permissions-modal {
        max-width: 600px;
      }

      .permissions-modal-body {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin: 20px 0;
      }

      .perms-list-title {
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 12px;
        color: #334155;
      }

      .perms-checkbox-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .perm-checkbox-item {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        font-size: 12px;
        color: #334155;
        user-select: none;
        padding: 4px 0;
      }

      .perm-checkbox-item:hover .perm-label {
        color: #166534;
      }

      .checkbox-icon {
        display: flex;
        align-items: center;
      }

      .role-select-box {
        width: 100%;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 12px;
        outline: 0;
        margin-bottom: 16px;
      }

      .role-desc-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        font-size: 11px;
        color: #64748b;
        line-height: 1.5;
      }

      .role-desc-box strong {
        display: block;
        color: #1e293b;
        margin-bottom: 4px;
      }

      .role-desc-box p {
        margin: 0;
      }

      .permissions-modal-foot {
        display: flex;
        justify-content: flex-end;
        border-top: 1px solid #f1f5f9;
        padding-top: 16px;
      }

      .btn-save-perms {
        background: #10352b;
        color: #ffffff;
        border: 0;
        border-radius: 8px;
        padding: 9px 20px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s;
      }

      .btn-save-perms:hover {
        background: #0d2a22;
      }

      /* RESPONSIVE */
      @media (max-width: 900px) {
        .product-pagination {
          align-items: flex-start;
          flex-direction: column;
        }
        .admin-sidebar {
          width: 70px;
        }
        .brand-name, .nav-item span {
          display: none;
        }
        .nav-item {
          justify-content: center;
          padding: 12px;
        }
        .stat-cards-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .overview-panels-grid {
          grid-template-columns: 1fr;
        }
        .permissions-modal-body {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}
