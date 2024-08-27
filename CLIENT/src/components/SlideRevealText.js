

function SlideRevealText() {
    return (
        <div>
            <div className="overflow-hidden m-16 pt-16">
                <motion.div className="text-6xl text-[#232323] flex justify-start font-bold pb-3"
                            ref={ref}
                            initial={{ y: '100%' }}
                            animate={hasBeenRevealed ? { y: 0 } : { y: '100%' }}
                            transition={{ duration: .5, ease: 'easeOut' }}
                            onViewportEnter={() => handleInViewChange(true)}
                            onViewportLeave={() => handleInViewChange(false)}>
                              Regain your agency
                </motion.div>
              </div>
              <div className="text-xl">
                <div className="text-block text-[#232323]">
                  <div className="flex justify-start overflow-hidden">
                    <motion.div className="px-16 text-left"
                                ref={ref}
                                initial={{ y: '150%' }}
                                animate={hasBeenRevealed ? { y: 0 } : { y: '150%' }}
                                transition={{ duration: .75, ease: 'easeOut' }}>
                      Watching media is supposed to me a means to an end. But algorithms, autoplay, and endless feedback loops
                    </motion.div>
                  </div>
                  <div className="flex justify-start overflow-hidden">
                    <motion.div className="px-16 text-left"
                                ref={ref}
                                initial={{ y: '150%' }}
                                animate={hasBeenRevealed ? { y: 0 } : { y: '150%' }}
                                transition={{ duration: .75, ease: 'easeOut' }}>
                      take advantage of human psychology to treat you as the means. Instead of letting passive consumption shape
                    </motion.div>
                  </div>
                  <div className="flex justify-start overflow-hidden">
                    <motion.div className="px-16 text-left"
                                ref={ref}
                                initial={{ y: '150%' }}
                                animate={hasBeenRevealed ? { y: 0 } : { y: '150%' }}
                                transition={{ duration: .75, ease: 'easeOut' }}>
                      your consious experience of the world, come back to what you want, not what an algorithm wants.
                    </motion.div>
                  </div>
                  <div className="flex justify-start overflow-hidden">
                    <motion.div className="px-16 pt-3 text-left text-3xl"
                                ref={ref}
                                initial={{ y: '150%' }}
                                animate={hasBeenRevealed ? { y: 0 } : { y: '150%' }}
                                transition={{ duration: .75, ease: 'easeOut' }}>
                      Experience media on your own terms.
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
        );
    };

export default SlideRevealText;