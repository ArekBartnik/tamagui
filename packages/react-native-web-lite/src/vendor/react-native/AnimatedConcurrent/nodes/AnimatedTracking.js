/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict'

import NativeAnimatedHelper from '../NativeAnimatedHelper.js'
import AnimatedNode from './AnimatedNode.js'

export default class AnimatedTracking extends AnimatedNode {
  _value
  _parent
  _callback
  _animationConfig
  _animationClass
  _useNativeDriver

  constructor(value, parent, animationClass, animationConfig, callback) {
    super()
    this._value = value
    this._parent = parent
    this._animationClass = animationClass
    this._animationConfig = animationConfig
    this._useNativeDriver =
      NativeAnimatedHelper.shouldUseNativeDriver(animationConfig)
    this._callback = callback
    this.__attach()
  }

  __makeNative(platformConfig) {
    this.__isNative = true
    this._parent.__makeNative(platformConfig)
    super.__makeNative(platformConfig)
    this._value.__makeNative(platformConfig)
  }

  __getValue() {
    return this._parent.__getValue()
  }

  __attach() {
    this._parent.__addChild(this)
    if (this._useNativeDriver) {
      // when the tracking starts we need to convert this node to a "native node"
      // so that the parent node will be made "native" too. This is necessary as
      // if we don't do this `update` method will get called. At that point it
      // may be too late as it would mean the JS driver has already started
      // updating node values
      let { platformConfig } = this._animationConfig
      this.__makeNative(platformConfig)
    }
  }

  __detach() {
    this._parent.__removeChild(this)
    super.__detach()
  }

  update() {
    this._value.animate(
      new this._animationClass({
        ...this._animationConfig,
        toValue: this._animationConfig.toValue.__getValue(),
      }),
      this._callback,
    )
  }

  __getNativeConfig() {
    const animation = new this._animationClass({
      ...this._animationConfig,
      // remove toValue from the config as it's a ref to Animated.Value
      toValue: undefined,
    })
    const animationConfig = animation.__getNativeAnimationConfig()
    return {
      type: 'tracking',
      animationId: NativeAnimatedHelper.generateNewAnimationId(),
      animationConfig,
      toValue: this._parent.__getNativeTag(),
      value: this._value.__getNativeTag(),
    }
  }
}
