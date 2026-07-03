import { cloneElement, isValidElement, useEffect, useId, useState } from 'react'

import styles from './Tooltip.module.css'

export default function Tooltip({
  children,
  content,
  className = '',
  align = 'center',
  delay = 500,
}) {
  const tooltipId = useId()
  const [isVisible, setIsVisible] = useState(false)
  const [hoverTimeoutId, setHoverTimeoutId] = useState(null)

  useEffect(() => {
    return () => {
      if (hoverTimeoutId) {
        clearTimeout(hoverTimeoutId)
      }
    }
  }, [hoverTimeoutId])

  function clearHoverTimeout() {
    if (hoverTimeoutId) {
      clearTimeout(hoverTimeoutId)
      setHoverTimeoutId(null)
    }
  }

  function scheduleOpen() {
    if (hoverTimeoutId) {
      clearTimeout(hoverTimeoutId)
    }

    const timeoutId = setTimeout(() => {
      setIsVisible(true)
      setHoverTimeoutId(null)
    }, delay)

    setHoverTimeoutId(timeoutId)
  }

  function hideTooltip() {
    clearHoverTimeout()
    setIsVisible(false)
  }

  const resolvedClassName = [
    styles.tooltip,
    align === 'start'
      ? styles.alignStart
      : align === 'end'
        ? styles.alignEnd
        : styles.alignCenter,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (!isValidElement(children)) {
    return children
  }

  const describedBy = [children.props['aria-describedby'], tooltipId]
    .filter(Boolean)
    .join(' ')

  const child = cloneElement(children, {
    'aria-describedby': describedBy,
    onBlur: (event) => {
      children.props.onBlur?.(event)

      if (!event.defaultPrevented) {
        hideTooltip()
      }
    },
    onClick: (event) => {
      children.props.onClick?.(event)

      if (!event.defaultPrevented) {
        hideTooltip()
      }
    },
    onFocus: (event) => {
      children.props.onFocus?.(event)

      if (!event.defaultPrevented) {
        setIsVisible(true)
      }
    },
    onMouseEnter: (event) => {
      children.props.onMouseEnter?.(event)

      if (!event.defaultPrevented) {
        scheduleOpen()
      }
    },
    onMouseLeave: (event) => {
      children.props.onMouseLeave?.(event)

      if (!event.defaultPrevented) {
        hideTooltip()
      }
    },
  })

  return (
    <span className={resolvedClassName} data-visible={isVisible}>
      {child}
      <span className={styles.bubble} id={tooltipId} role="tooltip">
        {content}
      </span>
    </span>
  )
}
