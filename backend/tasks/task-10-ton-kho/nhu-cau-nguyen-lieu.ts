/**
 * Value Object BẤT BIẾN mô tả nhu cầu nguyên liệu: ingredientId → số lượng (số nguyên > 0).
 *
 * - Không có setter; mọi thao tác "thay đổi" (`them`/`add`, `gop`/`merge`) trả về một bản MỚI.
 * - Map bên trong không bao giờ bị lộ ra ngoài: `danhSachPhanTu()` / `sangJSON()` luôn trả bản sao.
 * - `danhSachPhanTu()` sắp xếp theo id tăng dần để mọi nơi duyệt theo cùng một thứ tự
 *   (quan trọng cho việc khóa/cập nhật hàng theo thứ tự cố định, tránh deadlock).
 */
export class IngredientDemand {
  private readonly soLuongNguyenLieu: ReadonlyMap<string, number>;

  private constructor(quantities: Map<string, number>) {
    this.soLuongNguyenLieu = quantities;
    Object.freeze(this);
  }

  /** Nhu cầu rỗng. */
  static khoiTaoRong(): IngredientDemand {
    return new IngredientDemand(new Map());
  }

  static empty(): IngredientDemand {
    return IngredientDemand.khoiTaoRong();
  }

  /**
   * Khôi phục từ JSON đã lưu (ví dụ `Order.ingredientUsage`).
   * Ném lỗi nếu dữ liệu không phải object { [id]: số nguyên >= 0 }.
   */
  static tuJSON(json: unknown): IngredientDemand {
    if (json === null || typeof json !== 'object' || Array.isArray(json)) {
      throw new TypeError('Dữ liệu nhu cầu nguyên liệu không hợp lệ');
    }
    let nhuCau = IngredientDemand.khoiTaoRong();
    for (const [maNguyenLieu, soLuong] of Object.entries(json as Record<string, unknown>)) {
      if (typeof soLuong !== 'number') {
        throw new TypeError(`Số lượng của nguyên liệu ${maNguyenLieu} không hợp lệ`);
      }
      nhuCau = nhuCau.them(maNguyenLieu, soLuong);
    }
    return nhuCau;
  }

  static fromJSON(json: unknown): IngredientDemand {
    return IngredientDemand.tuJSON(json);
  }

  /** Trả bản mới đã cộng thêm `soLuong` cho nguyên liệu `maNguyenLieu`. `soLuong = 0` trả về chính nó. */
  them(maNguyenLieu: string, soLuong: number): IngredientDemand {
    if (typeof maNguyenLieu !== 'string' || maNguyenLieu.length === 0) {
      throw new TypeError('Mã nguyên liệu không hợp lệ');
    }
    if (!Number.isSafeInteger(soLuong) || soLuong < 0) {
      throw new RangeError(`Số lượng nguyên liệu phải là số nguyên không âm (nhận: ${soLuong})`);
    }
    if (soLuong === 0) return this;
    const tiepTheo = new Map(this.soLuongNguyenLieu);
    tiepTheo.set(maNguyenLieu, (tiepTheo.get(maNguyenLieu) ?? 0) + soLuong);
    return new IngredientDemand(tiepTheo);
  }

  add(id: string, qty: number): IngredientDemand {
    return this.them(id, qty);
  }

  /** Gộp hai nhu cầu (cộng dồn theo từng nguyên liệu), trả bản mới. */
  gop(nhuCauKhac: IngredientDemand): IngredientDemand {
    let ketQua: IngredientDemand = this;
    for (const [maNguyenLieu, soLuong] of nhuCauKhac.danhSachPhanTu()) {
      ketQua = ketQua.them(maNguyenLieu, soLuong);
    }
    return ketQua;
  }

  merge(other: IngredientDemand): IngredientDemand {
    return this.gop(other);
  }

  /** Lượng cần của một nguyên liệu (0 nếu không có). */
  lay(maNguyenLieu: string): number {
    return this.soLuongNguyenLieu.get(maNguyenLieu) ?? 0;
  }

  get(id: string): number {
    return this.lay(id);
  }

  /** Danh sách [id, qty] — bản sao, sắp xếp theo id tăng dần. */
  danhSachPhanTu(): Array<[string, number]> {
    return Array.from(this.soLuongNguyenLieu.entries()).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  }

  entries(): Array<[string, number]> {
    return this.danhSachPhanTu();
  }

  /** Danh sách id nguyên liệu, sắp xếp tăng dần. */
  danhSachMaNguyenLieu(): string[] {
    return this.danhSachPhanTu().map(([id]) => id);
  }

  ingredientIds(): string[] {
    return this.danhSachMaNguyenLieu();
  }

  laRong(): boolean {
    return this.soLuongNguyenLieu.size === 0;
  }

  isEmpty(): boolean {
    return this.laRong();
  }

  /** Dạng JSON thuần để lưu vào cột Json (`Order.ingredientUsage`). */
  sangJSON(): Record<string, number> {
    const ketQuaJson: Record<string, number> = {};
    for (const [maNguyenLieu, soLuong] of this.danhSachPhanTu()) ketQuaJson[maNguyenLieu] = soLuong;
    return ketQuaJson;
  }

  toJSON(): Record<string, number> {
    return this.sangJSON();
  }
}
