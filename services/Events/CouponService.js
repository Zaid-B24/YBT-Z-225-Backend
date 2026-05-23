class CouponService {
  static async applyDiscount(couponCode, baseAmount, eventId, tx) {
    if (!couponCode) {
      return { finalAmount: baseAmount, discountAmount: 0, couponId: null };
    }

    const coupon = await tx.coupon.findUnique({
      where: { code: couponCode },
    });

    if (!coupon) {
      throw this._createError("Invalid coupon code.");
    }
    if (!coupon.isActive) {
      throw this._createError("This coupon is no longer active.");
    }

    const now = new Date();
    if (coupon.validUntil && now > coupon.validUntil) {
      throw this._createError("This coupon has expired.");
    }
    if (now < coupon.validFrom) {
      throw this._createError("This coupon is not valid yet.");
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw this._createError("This coupon has reached its usage limit.");
    }
    if (coupon.minOrderValue !== null && baseAmount < coupon.minOrderValue) {
      throw this._createError(
        `This coupon requires a minimum order value of ${coupon.minOrderValue}.`,
      );
    }
    if (coupon.eventId !== null && coupon.eventId !== eventId) {
      throw this._createError("This coupon is not valid for this event.");
    }

    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (baseAmount * coupon.discountValue) / 100;
    } else if (coupon.discountType === "FLAT") {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, baseAmount);
    const finalAmount = baseAmount - discountAmount;

    await tx.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });

    return {
      finalAmount,
      discountAmount,
      couponId: coupon.id,
    };
  }

  static async preValidateDiscount(couponCode, baseAmount, eventId) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });

    if (!coupon) throw this._createError("Invalid coupon code.");
    if (!coupon.isActive)
      throw this._createError("This coupon is no longer active.");

    const now = new Date();
    if (coupon.validUntil && now > coupon.validUntil) {
      throw this._createError("This coupon has expired.");
    }
    if (now < coupon.validFrom) {
      throw this._createError("This coupon is not valid yet.");
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw this._createError("This coupon has reached its usage limit.");
    }
    if (coupon.minOrderValue !== null && baseAmount < coupon.minOrderValue) {
      throw this._createError(
        `This coupon requires a minimum order value of ${coupon.minOrderValue}.`,
      );
    }
    if (coupon.eventId !== null && coupon.eventId !== eventId) {
      throw this._createError("This coupon is not valid for this event.");
    }

    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (baseAmount * coupon.discountValue) / 100;
    } else if (coupon.discountType === "FLAT") {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, baseAmount);
    return { finalAmount: baseAmount - discountAmount, discountAmount };
  }

  static _createError(message) {
    const err = new Error(message);
    err.isOperational = true;
    return err;
  }
}

module.exports = CouponService;
