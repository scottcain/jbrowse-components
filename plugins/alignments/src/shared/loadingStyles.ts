import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()(theme => {
  const bg = theme.palette.action.disabledBackground
  return {
    loading: {
      paddingLeft: '0.6em',
      backgroundColor: theme.palette.background.default,
      backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, ${bg} 5px, ${bg} 10px)`,
      width: '100%',
      pointerEvents: 'none',
      textAlign: 'center',
      height: 20,
      position: 'absolute',
    },
  }
})

export default useStyles
